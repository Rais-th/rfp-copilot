import { NextResponse } from "next/server";
import { getActiveRfps } from "@/lib/db/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await getActiveRfps(100);
    return NextResponse.json({ rfps: rows });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message, rfps: [] },
      { status: 500 },
    );
  }
}
