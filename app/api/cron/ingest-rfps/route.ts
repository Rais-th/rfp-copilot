import { NextRequest, NextResponse } from "next/server";
import {
  scrapeMemphisListings,
  fetchRfpDocumentText,
} from "@/lib/scraper/memphis-beacon";
import { parseRfpStructure } from "@/lib/parser/structure";
import { upsertRfp } from "@/lib/db/queries";
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
  const listings = await scrapeMemphisListings();
  let inserted = 0;
  let parsed = 0;
  const errors: string[] = [];

  for (const listing of listings.slice(0, 40)) {
    const id = makeId("memphis", listing.sourceRef);
    try {
      await upsertRfp({
        id,
        source: "memphis",
        sourceRef: listing.sourceRef,
        title: listing.title,
        agency: listing.agency,
        category: listing.category,
        issuedAt: listing.issuedAt,
        closesAt: listing.closesAt,
        documentUrl: listing.documentUrl,
        listingUrl: listing.listingUrl,
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

      const docText =
        existing[0]?.rawText ??
        (await fetchRfpDocumentText(listing.documentUrl));
      if (!docText) continue;

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
    listings: listings.length,
    inserted,
    parsed,
    ms: Date.now() - started,
    errors: errors.slice(0, 10),
  });
}
