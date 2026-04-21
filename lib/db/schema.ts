import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const rfps = pgTable(
  "rfps",
  {
    id: text("id").primaryKey(),
    source: text("source").notNull(),
    sourceRef: text("source_ref").notNull(),
    title: text("title").notNull(),
    agency: text("agency"),
    category: text("category"),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    valueLow: integer("value_low"),
    valueHigh: integer("value_high"),
    documentUrl: text("document_url"),
    listingUrl: text("listing_url"),
    rawText: text("raw_text"),
    parsed: jsonb("parsed").$type<ParsedRfp | null>(),
    ingestedAt: timestamp("ingested_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    sourceRefIdx: uniqueIndex("rfps_source_ref_uniq").on(t.source, t.sourceRef),
    closesAtIdx: index("rfps_closes_at_idx").on(t.closesAt),
  }),
);

export const llmCache = pgTable("llm_cache", {
  key: text("key").primaryKey(),
  model: text("model").notNull(),
  output: text("output").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const draftSessions = pgTable("draft_sessions", {
  id: text("id").primaryKey(),
  rfpId: text("rfp_id")
    .references(() => rfps.id, { onDelete: "cascade" })
    .notNull(),
  profileHash: text("profile_hash").notNull(),
  draftMarkdown: text("draft_markdown"),
  validationReport: jsonb("validation_report"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Rfp = typeof rfps.$inferSelect;
export type NewRfp = typeof rfps.$inferInsert;

export type ParsedRfp = {
  summary: string;
  requiredSections: Array<{
    name: string;
    description: string;
    pageLimit?: number | null;
    wordLimit?: number | null;
  }>;
  qualifications: string[];
  evaluationCriteria: string[];
  requiredAttachments: string[];
  submissionInstructions?: string;
};
