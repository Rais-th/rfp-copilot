import { anthropic, MODEL_PARSE } from "../anthropic";
import type { ParsedRfp } from "../db/schema";

const SYSTEM = `You extract structured response requirements from US government RFP documents.
You never invent requirements. If a section is unclear, mark it as likely.
Return JSON only, matching the schema provided. No prose.`;

const USER_TEMPLATE = (text: string) => `RFP TEXT:
"""
${text.slice(0, 60000)}
"""

Return JSON with this exact shape:
{
  "summary": "string, 2 sentences max, plain English",
  "requiredSections": [{"name": "string", "description": "string", "pageLimit": number or null, "wordLimit": number or null}],
  "qualifications": ["string"],
  "evaluationCriteria": ["string"],
  "requiredAttachments": ["string"],
  "submissionInstructions": "string or null"
}`;

export async function parseRfpStructure(
  rawText: string,
): Promise<ParsedRfp | null> {
  if (!rawText || rawText.length < 200) return null;
  const res = await anthropic.messages.create({
    model: MODEL_PARSE,
    max_tokens: 4096,
    system: SYSTEM,
    messages: [{ role: "user", content: USER_TEMPLATE(rawText) }],
  });
  const block = res.content.find((c) => c.type === "text");
  if (!block || block.type !== "text") return null;
  const jsonText = extractJson(block.text);
  if (!jsonText) return null;
  try {
    return JSON.parse(jsonText) as ParsedRfp;
  } catch {
    return null;
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
