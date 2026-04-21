import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
} from "docx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  draft: z.string().min(1),
  filename: z.string().default("rfp-draft"),
  format: z.enum(["docx", "md"]).default("docx"),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { draft, filename, format } = parsed.data;

  if (format === "md") {
    return new NextResponse(draft, {
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "content-disposition": `attachment; filename="${safeName(filename)}.md"`,
      },
    });
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
      },
    },
    sections: [
      {
        children: markdownToParagraphs(draft),
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "content-disposition": `attachment; filename="${safeName(filename)}.docx"`,
    },
  });
}

function markdownToParagraphs(md: string): Paragraph[] {
  const lines = md.split(/\r?\n/);
  const paragraphs: Paragraph[] = [];
  for (const line of lines) {
    if (/^#\s+/.test(line)) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun(line.replace(/^#\s+/, ""))],
        }),
      );
    } else if (/^##\s+/.test(line)) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun(line.replace(/^##\s+/, ""))],
        }),
      );
    } else if (/^###\s+/.test(line)) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun(line.replace(/^###\s+/, ""))],
        }),
      );
    } else if (line.trim() === "") {
      paragraphs.push(new Paragraph({}));
    } else {
      paragraphs.push(new Paragraph({ children: [new TextRun(line)] }));
    }
  }
  return paragraphs;
}

function safeName(s: string) {
  return s.replace(/[^a-z0-9\-_.]/gi, "-").slice(0, 80);
}
