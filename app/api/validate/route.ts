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
  if (!rfp?.parsed) {
    return NextResponse.json({ error: "rfp_not_parsed" }, { status: 409 });
  }

  const res = await anthropic.messages.create({
    model: MODEL_VALIDATE,
    max_tokens: 3000,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `RFP REQUIRED SECTIONS:
${parsed.data.profile ? "" : ""}${JSON.stringify(rfp.parsed.requiredSections, null, 2)}

RFP EVALUATION CRITERIA:
${JSON.stringify(rfp.parsed.evaluationCriteria, null, 2)}

RFP REQUIRED ATTACHMENTS:
${JSON.stringify(rfp.parsed.requiredAttachments, null, 2)}

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
  const json2 = extractJson(text);
  if (!json2) {
    return NextResponse.json(
      { error: "parse_failed", raw: text.slice(0, 400) },
      { status: 502 },
    );
  }
  return new NextResponse(json2, {
    headers: { "content-type": "application/json" },
  });
}

function extractJson(text: string): string | null {
  const fenced = text.match(/```json\s*([\s\S]+?)```/);
  if (fenced) return fenced[1].trim();
  const brace = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (brace >= 0 && end > brace) return text.slice(brace, end + 1);
  return null;
}
