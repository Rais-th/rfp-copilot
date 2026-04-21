const BASE = "https://api.sam.gov/prod/opportunities/v2/search";

export type SamOpportunity = {
  noticeId: string;
  title: string;
  solicitationNumber: string | null;
  department: string | null;
  subTier: string | null;
  office: string | null;
  postedDate: string | null;
  responseDeadLine: string | null;
  naicsCode: string | null;
  classificationCode: string | null;
  active: string | null;
  type: string | null;
  typeOfSetAsideDescription: string | null;
  uiLink: string | null;
  description: string | null;
  resourceLinks: string[] | null;
  pointOfContact:
    | { email?: string; fullName?: string; phone?: string }[]
    | null;
  placeOfPerformance: {
    city?: { name?: string } | null;
    state?: { name?: string; code?: string } | null;
  } | null;
};

export type SamSearchParams = {
  state?: string;
  ncode?: string;
  postedFromDaysAgo?: number;
  limit?: number;
  offset?: number;
  ptype?: string;
};

export async function searchSamOpportunities(
  params: SamSearchParams = {},
): Promise<SamOpportunity[]> {
  const apiKey = process.env.SAM_GOV_API_KEY;
  if (!apiKey) {
    throw new Error("SAM_GOV_API_KEY missing");
  }
  const {
    state = "TN",
    postedFromDaysAgo = 14,
    limit = 50,
    offset = 0,
    ptype = "o,p,k",
  } = params;

  const postedFrom = formatDate(daysAgo(postedFromDaysAgo));
  const postedTo = formatDate(new Date());

  const qs = [
    `api_key=${encodeURIComponent(apiKey)}`,
    `limit=${limit}`,
    `offset=${offset}`,
    `postedFrom=${postedFrom}`,
    `postedTo=${postedTo}`,
    `ptype=${ptype}`,
  ];
  if (state) qs.push(`state=${state}`);
  if (params.ncode) qs.push(`ncode=${params.ncode}`);
  const url = `${BASE}?${qs.join("&")}`;

  const res = await fetch(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SAM.gov ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { opportunitiesData?: SamOpportunity[] };
  return data.opportunitiesData ?? [];
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function formatDate(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

export function samOpportunityToRow(o: SamOpportunity) {
  const city =
    (o.placeOfPerformance?.city?.name ?? "") +
    (o.placeOfPerformance?.state?.code
      ? `, ${o.placeOfPerformance.state.code}`
      : "");
  return {
    sourceRef: o.noticeId,
    title: o.title,
    agency: [o.department, o.subTier, o.office].filter(Boolean).join(" | ") || null,
    category: o.naicsCode
      ? `NAICS ${o.naicsCode}${o.typeOfSetAsideDescription ? ` | ${o.typeOfSetAsideDescription}` : ""}`
      : o.typeOfSetAsideDescription ?? null,
    issuedAt: o.postedDate ? new Date(o.postedDate) : null,
    closesAt: o.responseDeadLine ? new Date(o.responseDeadLine) : null,
    documentUrl: o.resourceLinks?.[0] ?? null,
    listingUrl: o.uiLink ?? null,
    contactName: o.pointOfContact?.[0]?.fullName ?? null,
    contactEmail: o.pointOfContact?.[0]?.email ?? null,
    placeOfPerformance: city || null,
    description: o.description ?? null,
  };
}
