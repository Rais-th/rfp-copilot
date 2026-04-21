import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = process.env.POSTGRES_URL;
  if (!url) {
    return NextResponse.json({ error: "no_postgres_url" }, { status: 500 });
  }

  const sql = postgres(url, { max: 1, prepare: false, ssl: "require" });
  try {
    const migrationPath = join(
      process.cwd(),
      "lib/db/migrations/0000_init.sql",
    );
    const file = await readFile(migrationPath, "utf8");
    const statements = file
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      await sql.unsafe(stmt);
    }
    return NextResponse.json({ ok: true, applied: statements.length });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
