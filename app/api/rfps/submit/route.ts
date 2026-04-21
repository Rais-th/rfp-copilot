import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { upsertRfp } from "@/lib/db/queries";
import { parseRfpStructure } from "@/lib/parser/structure";
import { fetchDocumentText } from "@/lib/fetch-doc";
import { db } from "@/lib/db/client";
import { rfps } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UrlSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
});

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null);
    const parsed = UrlSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_body", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    return handleUrlSubmission(parsed.data.url, parsed.data.title);
  }

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    const title = (form.get("title") ?? "").toString().trim();
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "no_file" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "file_too_large" }, { status: 413 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const { default: pdfParse } = await import("pdf-parse");
    let text: string;
    try {
      const parsedPdf = await pdfParse(buf);
      text = parsedPdf.text ?? "";
    } catch (err) {
      return NextResponse.json(
        { error: "pdf_parse_failed", detail: (err as Error).message },
        { status: 400 },
      );
    }
    if (!text || text.length < 200) {
      return NextResponse.json(
        { error: "pdf_text_too_short" },
        { status: 400 },
      );
    }
    return finalizeRfp({
      source: "upload",
      sourceRef: hashText(file.name + "|" + buf.byteLength),
      title: title || file.name.replace(/\.pdf$/i, ""),
      rawText: text,
      documentUrl: null,
      listingUrl: null,
    });
  }

  return NextResponse.json(
    { error: "unsupported_content_type" },
    { status: 415 },
  );
}

async function handleUrlSubmission(url: string, title?: string) {
  const doc = await fetchDocumentText(url);
  if (!doc) {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }
  if (!doc.text || doc.text.length < 200) {
    return NextResponse.json(
      { error: "document_text_too_short" },
      { status: 400 },
    );
  }
  return finalizeRfp({
    source: "url",
    sourceRef: hashText(url),
    title: title?.trim() || deriveTitle(doc.text, url),
    rawText: doc.text,
    documentUrl: url,
    listingUrl: url,
  });
}

async function finalizeRfp(input: {
  source: string;
  sourceRef: string;
  title: string;
  rawText: string;
  documentUrl: string | null;
  listingUrl: string | null;
}) {
  const id = `${input.source}:${input.sourceRef}`.toLowerCase();
  await upsertRfp({
    id,
    source: input.source,
    sourceRef: input.sourceRef,
    title: input.title,
    agency: null,
    category: null,
    issuedAt: null,
    closesAt: null,
    documentUrl: input.documentUrl,
    listingUrl: input.listingUrl,
    rawText: input.rawText,
  });

  const structured = await parseRfpStructure(input.rawText);
  if (structured?.requiredSections?.length) {
    await db
      .update(rfps)
      .set({ parsed: structured, updatedAt: new Date() })
      .where(eq(rfps.id, id));
  }

  return NextResponse.json({ ok: true, id, parsed: !!structured });
}

function deriveTitle(text: string, url: string) {
  const firstLine = text
    .split(/\n|\r/)
    .map((s) => s.trim())
    .find((s) => s.length > 10 && s.length < 200);
  if (firstLine) return firstLine.slice(0, 180);
  try {
    return new URL(url).pathname.split("/").filter(Boolean).pop() ?? url;
  } catch {
    return url;
  }
}

function hashText(s: string) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  const out = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return out.toString(36);
}
