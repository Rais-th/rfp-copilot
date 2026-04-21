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

  const url = `https://api.sam.gov/prod/opportunities/v2/search?api_key=${encodeURIComponent(key)}&limit=1&postedFrom=${fmt(weekAgo)}&postedTo=${fmt(today)}&ptype=o,p,k`;

  const safeUrl = url.replace(key, `<key:${keyPrefix}...${keySuffix}>`);

  let status = 0;
  let body = "";
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
    });
    status = res.status;
    body = await res.text();
  } catch (err) {
    return NextResponse.json({
      keyLen,
      keyPrefix,
      keySuffix,
      safeUrl,
      fetchError: (err as Error).message,
    });
  }

  return NextResponse.json({
    keyLen,
    keyPrefix,
    keySuffix,
    safeUrl,
    status,
    bodyPreview: body.slice(0, 800),
  });
}
