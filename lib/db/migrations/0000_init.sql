CREATE TABLE IF NOT EXISTS "rfps" (
  "id" text PRIMARY KEY,
  "source" text NOT NULL,
  "source_ref" text NOT NULL,
  "title" text NOT NULL,
  "agency" text,
  "category" text,
  "issued_at" timestamptz,
  "closes_at" timestamptz,
  "contact_name" text,
  "contact_email" text,
  "value_low" integer,
  "value_high" integer,
  "document_url" text,
  "listing_url" text,
  "raw_text" text,
  "parsed" jsonb,
  "ingested_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "rfps_source_ref_uniq" ON "rfps" ("source", "source_ref");
CREATE INDEX IF NOT EXISTS "rfps_closes_at_idx" ON "rfps" ("closes_at");

CREATE TABLE IF NOT EXISTS "llm_cache" (
  "key" text PRIMARY KEY,
  "model" text NOT NULL,
  "output" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "draft_sessions" (
  "id" text PRIMARY KEY,
  "rfp_id" text NOT NULL REFERENCES "rfps"("id") ON DELETE CASCADE,
  "profile_hash" text NOT NULL,
  "draft_markdown" text,
  "validation_report" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
