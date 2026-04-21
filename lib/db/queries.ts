import { and, desc, eq, gt, gte, sql as dsql } from "drizzle-orm";
import { db } from "./client";
import { rfps } from "./schema";

export async function getActiveRfps(limit = 50) {
  const now = new Date();
  return db
    .select()
    .from(rfps)
    .where(gt(rfps.closesAt, now))
    .orderBy(rfps.closesAt)
    .limit(limit);
}

export async function getActiveRfpsCount() {
  const now = new Date();
  const [row] = await db
    .select({ c: dsql<number>`count(*)::int` })
    .from(rfps)
    .where(gt(rfps.closesAt, now));
  return row?.c ?? 0;
}

export async function getRfpById(id: string) {
  const [row] = await db.select().from(rfps).where(eq(rfps.id, id)).limit(1);
  return row ?? null;
}

export async function upsertRfp(input: {
  id: string;
  source: string;
  sourceRef: string;
  title: string;
  agency?: string | null;
  category?: string | null;
  issuedAt?: Date | null;
  closesAt?: Date | null;
  documentUrl?: string | null;
  listingUrl?: string | null;
  rawText?: string | null;
}) {
  await db
    .insert(rfps)
    .values({
      ...input,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [rfps.source, rfps.sourceRef],
      set: {
        title: input.title,
        agency: input.agency ?? null,
        category: input.category ?? null,
        closesAt: input.closesAt ?? null,
        documentUrl: input.documentUrl ?? null,
        listingUrl: input.listingUrl ?? null,
        rawText: input.rawText ?? null,
        updatedAt: new Date(),
      },
    });
}
