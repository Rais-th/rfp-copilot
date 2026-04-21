import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const key = process.env.SAM_GOV_API_KEY ?? "";
  const keyLen = key.length;
  const keyPrefix = key.slice(0, 4);
  const keySuffix = key.slice(-4);

  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 14);
  const fmt = (d: Date) =>
    `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;

  const tests = [
    `https://api.sam.gov/prod/opportunities/v2/search?api_key=${key}&limit=1&postedFrom=${fmt(weekAgo)}&postedTo=${fmt(today)}`,
    `https://api.sam.gov/opportunities/v2/search?api_key=${key}&limit=1&postedFrom=${fmt(weekAgo)}&postedTo=${fmt(today)}`,
    `https://api.sam.gov/entity-information/v3/entities?api_key=${key}&samRegistered=Yes&registrationStatus=A&includeSections=coreData`,
    `https://api.sam.gov/data-services/v1/extracts?api_key=${key}`,
  ];

  const results = [];
  for (const testUrl of tests) {
    const safeUrl = testUrl.replace(key, `<key:${keyPrefix}...${keySuffix}>`);
    try {
      const res = await fetch(testUrl, {
        headers: { accept: "application/json" },
      });
      const body = await res.text();
      results.push({
        safeUrl,
        status: res.status,
        bodyPreview: body.slice(0, 300),
      });
    } catch (err) {
      results.push({
        safeUrl,
        fetchError: (err as Error).message,
      });
    }
  }

  return NextResponse.json({
    keyLen,
    keyPrefix,
    keySuffix,
    results,
  });
}
