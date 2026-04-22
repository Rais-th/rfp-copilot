import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { anthropic, MODEL_VALIDATE } from "@/lib/anthropic";
import { getRfpById } from "@/lib/db/queries";
import { BusinessProfileSchema } from "@/lib/types/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  rfpId: z.string().min(1),
  draft: z.string().min(20),
  profile: BusinessProfileSchema,
});

const SYSTEM = `You are a strict proposal compliance reviewer.
Your job is to flag gaps between the RFP requirements and the draft.
Never invent requirements not in the source. Return JSON only.`;

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const rfp = await getRfpById(parsed.data.rfpId);
  if (!rfp) {
    return NextResponse.json(
      {
        overall: "warn",
        checks: [],
        missingSections: [],
        unsupportedClaims: [],
        limitOverages: [],
        notice:
          "RFP record not found. Cannot validate against source requirements.",
      },
      { status: 200 },
    );
  }

  const hasStructured =
    !!rfp.parsed &&
    Array.isArray(rfp.parsed.requiredSections) &&
    rfp.parsed.requiredSections.length > 0;

  if (!hasStructured) {
    return NextResponse.json(
      {
        overall: "warn",
        checks: [
          {
            id: "no_source_structure",
            label: "No structured requirements from source",
            status: "warn",
            detail:
              "This RFP does not have parsed required sections. Submit the full solicitation PDF via Submit RFP for a structured validation.",
          },
        ],
        missingSections: [],
        unsupportedClaims: [],
        limitOverages: [],
      },
      { status: 200 },
    );
  }

  try {
    const res = await anthropic.messages.create({
      model: MODEL_VALIDATE,
      max_tokens: 3000,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `RFP REQUIRED SECTIONS:
${JSON.stringify(rfp.parsed!.requiredSections, null, 2)}

RFP EVALUATION CRITERIA:
${JSON.stringify(rfp.parsed!.evaluationCriteria, null, 2)}

RFP REQUIRED ATTACHMENTS:
${JSON.stringify(rfp.parsed!.requiredAttachments, null, 2)}

DRAFT:
"""
${parsed.data.draft.slice(0, 40000)}
"""

Return JSON with this shape:
{
  "overall": "pass" | "warn" | "fail",
  "checks": [{"id": "string", "label": "string", "status": "pass" | "warn" | "fail", "detail": "string"}],
  "missingSections": ["string"],
  "unsupportedClaims": ["string"],
  "limitOverages": ["string"]
}`,
        },
      ],
    });

    const block = res.content.find((c) => c.type === "text");
    const text = block && block.type === "text" ? block.text : "";
    const jsonText = extractJson(text);
    if (!jsonText) {
      return NextResponse.json(
        {
          overall: "warn",
          checks: [
            {
              id: "model_no_structured_response",
              label: "Validation model returned no structured output",
              status: "warn",
              detail:
                "Claude did not return parseable JSON for this draft. Try again, or edit the draft first.",
            },
          ],
          missingSections: [],
          unsupportedClaims: [],
          limitOverages: [],
        },
        { status: 200 },
      );
    }

    try {
      const report = JSON.parse(jsonText);
      return NextResponse.json(report);
    } catch {
      return NextResponse.json(
        {
          overall: "warn",
          checks: [
            {
              id: "model_json_parse_fail",
              label: "Could not parse validation output",
              status: "warn",
              detail: "The validation model produced malformed JSON.",
            },
          ],
          missingSections: [],
          unsupportedClaims: [],
          limitOverages: [],
        },
        { status: 200 },
      );
    }
  } catch (err) {
    return NextResponse.json(
      {
        overall: "warn",
        checks: [
          {
            id: "validation_exception",
            label: "Validation could not run",
            status: "warn",
            detail: (err as Error).message.slice(0, 300),
          },
        ],
        missingSections: [],
        unsupportedClaims: [],
        limitOverages: [],
      },
      { status: 200 },
    );
  }
}

function extractJson(text: string): string | null {
  const fenced = text.match(/```json\s*([\s\S]+?)```/);
  if (fenced) return fenced[1].trim();
  const brace = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (brace >= 0 && end > brace) return text.slice(brace, end + 1);
  return null;
}
