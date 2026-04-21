import { NextRequest } from "next/server";
import { z } from "zod";
import { anthropic, MODEL_DRAFT } from "@/lib/anthropic";
import { getRfpById } from "@/lib/db/queries";
import { BusinessProfileSchema } from "@/lib/types/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  rfpId: z.string().min(1),
  profile: BusinessProfileSchema,
});

const SYSTEM = `You are a senior proposal writer for small businesses pursuing US public sector contracts.
You produce a draft response skeleton that maps the business profile to the RFP requirements.
Hard rules:
1. Never fabricate past contracts, certifications, revenue, personnel, or facts not in the profile.
2. If a required claim is not supported by the profile, insert [FILL IN: description] markers.
3. Use required section headers exactly as given. Preserve required order.
4. Output in Markdown. No preamble. No closing remarks. Just the draft.
5. Do not use em dashes anywhere. Use periods, commas, colons.
6. Flag page and word limits in a small note under each heading when present.`;

function buildUserPrompt(args: {
  rfpTitle: string;
  rfpSummary: string;
  requiredSections: Array<{
    name: string;
    description: string;
    pageLimit?: number | null;
    wordLimit?: number | null;
  }>;
  qualifications: string[];
  evaluationCriteria: string[];
  profile: unknown;
}) {
  return `RFP TITLE: ${args.rfpTitle}

SUMMARY: ${args.rfpSummary}

REQUIRED SECTIONS (in order):
${args.requiredSections
  .map(
    (s, i) =>
      `${i + 1}. ${s.name}${s.pageLimit ? ` [max ${s.pageLimit} pages]` : ""}${s.wordLimit ? ` [max ${s.wordLimit} words]` : ""}\n   ${s.description}`,
  )
  .join("\n")}

MINIMUM QUALIFICATIONS:
${args.qualifications.map((q, i) => `- ${q}`).join("\n")}

EVALUATION CRITERIA:
${args.evaluationCriteria.map((c) => `- ${c}`).join("\n")}

BUSINESS PROFILE:
${JSON.stringify(args.profile, null, 2)}

Generate the draft now. Start directly with the first section heading.`;
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "invalid_body", issues: parsed.error.issues }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const rfp = await getRfpById(parsed.data.rfpId);
  if (!rfp) {
    return new Response(JSON.stringify({ error: "rfp_not_found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  const parsedStruct = rfp.parsed;
  if (!parsedStruct) {
    return new Response(
      JSON.stringify({ error: "rfp_not_parsed_yet" }),
      { status: 409, headers: { "content-type": "application/json" } },
    );
  }

  const stream = await anthropic.messages.stream({
    model: MODEL_DRAFT,
    max_tokens: 6000,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: buildUserPrompt({
          rfpTitle: rfp.title,
          rfpSummary: parsedStruct.summary,
          requiredSections: parsedStruct.requiredSections,
          qualifications: parsedStruct.qualifications,
          evaluationCriteria: parsedStruct.evaluationCriteria,
          profile: parsed.data.profile,
        }),
      },
    ],
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
