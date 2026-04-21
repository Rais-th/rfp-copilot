import { NextRequest, NextResponse } from "next/server";
import { searchSamOpportunities, samOpportunityToRow } from "@/lib/sources/sam-gov";
import { parseRfpStructure } from "@/lib/parser/structure";
import { upsertRfp } from "@/lib/db/queries";
import { fetchDocumentText } from "@/lib/fetch-doc";
import { db } from "@/lib/db/client";
import { rfps } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makeId(source: string, sourceRef: string) {
  return `${source}:${sourceRef}`.toLowerCase();
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  let opportunities;
  try {
    opportunities = await searchSamOpportunities({
      state: "TN",
      postedFromDaysAgo: 30,
      limit: 25,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        step: "sam_search",
        error: (err as Error).message,
      },
      { status: 500 },
    );
  }

  let inserted = 0;
  let parsed = 0;
  const errors: string[] = [];

  for (const opp of opportunities) {
    const row = samOpportunityToRow(opp);
    const id = makeId("sam", row.sourceRef);
    try {
      await upsertRfp({
        id,
        source: "sam",
        sourceRef: row.sourceRef,
        title: row.title,
        agency: row.agency,
        category: row.category,
        issuedAt: row.issuedAt,
        closesAt: row.closesAt,
        documentUrl: row.documentUrl,
        listingUrl: row.listingUrl,
      });
      inserted++;
    } catch (err) {
      errors.push(`upsert ${id}: ${(err as Error).message}`);
      continue;
    }

    try {
      const existing = await db
        .select({ parsed: rfps.parsed, rawText: rfps.rawText })
        .from(rfps)
        .where(eq(rfps.id, id))
        .limit(1);
      if (existing[0]?.parsed) continue;

      let docText = existing[0]?.rawText ?? null;
      if (!docText) {
        const doc = row.documentUrl
          ? await fetchDocumentText(row.documentUrl)
          : null;
        docText = doc?.text ?? row.description ?? null;
      }
      if (!docText || docText.length < 200) continue;

      const structured = await parseRfpStructure(docText);
      await db
        .update(rfps)
        .set({ rawText: docText, parsed: structured, updatedAt: new Date() })
        .where(eq(rfps.id, id));
      parsed++;
    } catch (err) {
      errors.push(`parse ${id}: ${(err as Error).message}`);
    }
  }

  return NextResponse.json({
    ok: true,
    source: "sam.gov",
    total: opportunities.length,
    inserted,
    parsed,
    ms: Date.now() - started,
    errors: errors.slice(0, 10),
  });
}
