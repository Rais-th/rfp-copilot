import * as cheerio from "cheerio";

const MEMPHIS_SOLICITATIONS_URL =
  process.env.MEMPHIS_BEACON_URL ??
  "https://memphistn.gov/government/procurement/solicitations/";

export type ScrapedListing = {
  sourceRef: string;
  title: string;
  agency: string | null;
  category: string | null;
  issuedAt: Date | null;
  closesAt: Date | null;
  documentUrl: string | null;
  listingUrl: string;
};

export async function scrapeMemphisListings(): Promise<ScrapedListing[]> {
  const res = await fetch(MEMPHIS_SOLICITATIONS_URL, {
    headers: {
      "User-Agent":
        "RFP-Copilot/0.1 (+https://github.com/Rais-th/rfp-copilot)",
      Accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Memphis fetch failed: ${res.status}`);
  }
  const html = await res.text();
  return parseMemphisListings(html, MEMPHIS_SOLICITATIONS_URL);
}

export function parseMemphisListings(
  html: string,
  baseUrl: string,
): ScrapedListing[] {
  const $ = cheerio.load(html);
  const listings: ScrapedListing[] = [];

  const rowSelectors = [
    "table tbody tr",
    ".solicitation",
    ".views-row",
    "article",
    "li.solicitation-item",
  ];
  let rows: cheerio.Cheerio<any> = $();
  for (const sel of rowSelectors) {
    const found = $(sel);
    if (found.length > 0) {
      rows = found;
      break;
    }
  }

  rows.each((_, el) => {
    const $el = $(el);
    const title = cleanText($el.find("h2, h3, .title, td").first().text());
    const href = $el.find("a").first().attr("href");
    if (!title || !href) return;

    const listingUrl = absoluteUrl(href, baseUrl);
    const sourceRef = extractRefFromUrl(listingUrl) ?? hash(listingUrl);

    const bodyText = cleanText($el.text());
    const issuedAt = findDateLabeled(bodyText, [
      "issued",
      "posted",
      "open date",
    ]);
    const closesAt = findDateLabeled(bodyText, [
      "close",
      "due",
      "deadline",
      "closing",
    ]);

    const category = extractLabeled(bodyText, ["category", "type"]);
    const agency = extractLabeled(bodyText, ["department", "agency", "div"]);
    const documentUrl = $el
      .find('a[href$=".pdf"], a[href*=".pdf?"]')
      .first()
      .attr("href");

    listings.push({
      sourceRef,
      title,
      agency,
      category,
      issuedAt,
      closesAt,
      documentUrl: documentUrl ? absoluteUrl(documentUrl, baseUrl) : null,
      listingUrl,
    });
  });

  return dedupe(listings);
}

function cleanText(s: string | undefined) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function absoluteUrl(href: string, base: string) {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function extractRefFromUrl(url: string) {
  const m = url.match(/(?:rfp|rfq|solicitation|bid)[\/\-_#=]*([A-Z0-9\-]+)/i);
  return m?.[1] ?? null;
}

function findDateLabeled(text: string, labels: string[]) {
  for (const label of labels) {
    const re = new RegExp(
      `${label}[^0-9]{0,20}(\\d{1,2}[\\/\\-\\.]\\d{1,2}[\\/\\-\\.]\\d{2,4}|[A-Za-z]+\\s+\\d{1,2},?\\s+\\d{4})`,
      "i",
    );
    const m = text.match(re);
    if (m) {
      const d = new Date(m[1]);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

function extractLabeled(text: string, labels: string[]) {
  for (const label of labels) {
    const re = new RegExp(`${label}[^a-z0-9]{1,4}([^|•\\n\\r]{2,80})`, "i");
    const m = text.match(re);
    if (m) return cleanText(m[1]).replace(/:/g, "").trim();
  }
  return null;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

function dedupe(listings: ScrapedListing[]): ScrapedListing[] {
  const seen = new Set<string>();
  const out: ScrapedListing[] = [];
  for (const l of listings) {
    if (seen.has(l.sourceRef)) continue;
    seen.add(l.sourceRef);
    out.push(l);
  }
  return out;
}

export async function fetchRfpDocumentText(
  documentUrl: string | null,
): Promise<string | null> {
  if (!documentUrl) return null;
  const res = await fetch(documentUrl, {
    headers: { "User-Agent": "RFP-Copilot/0.1" },
  });
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("pdf") || documentUrl.toLowerCase().endsWith(".pdf")) {
    const buf = Buffer.from(await res.arrayBuffer());
    const { default: pdfParse } = await import("pdf-parse");
    const parsed = await pdfParse(buf);
    return parsed.text ?? null;
  }
  return await res.text();
}
