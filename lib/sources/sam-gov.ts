const BASE = "https://sam.gov/api/prod/sgs/v1/search";

export type SamOpportunity = {
  _id: string;
  title?: string;
  solicitationNumber?: string | null;
  publishDate?: string | null;
  modifiedDate?: string | null;
  responseDate?: string | null;
  descriptions?: { content?: string; lastModifiedDate?: string }[] | null;
  organizationName?: string | null;
  naicsList?: { code?: string; value?: string }[] | null;
  classificationCode?: string | null;
};

export type SamSearchParams = {
  query?: string;
  size?: number;
  activeOnly?: boolean;
};

export async function searchSamOpportunities(
  params: SamSearchParams = {},
): Promise<SamOpportunity[]> {
  const { query = "Tennessee", size = 25, activeOnly = true } = params;

  const qs = [
    "index=opp",
    "sort=-modifiedDate",
    "mode=search",
    `size=${size}`,
    `q=${encodeURIComponent(query)}`,
  ];
  if (activeOnly) qs.push("is_active=true");
  const url = `${BASE}?${qs.join("&")}`;

  const res = await fetch(url, {
    headers: { accept: "application/hal+json, application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SAM.gov ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    _embedded?: { results?: SamOpportunity[] };
  };
  return data._embedded?.results ?? [];
}

export function samOpportunityToRow(o: SamOpportunity) {
  const descText = o.descriptions?.[0]?.content ?? null;
  const naics = o.naicsList?.[0]?.code ?? null;
  return {
    sourceRef: o._id,
    title: (o.title ?? "Untitled").slice(0, 500),
    agency: o.organizationName ?? null,
    category: naics ? `NAICS ${naics}` : o.classificationCode ?? null,
    issuedAt: o.publishDate ? new Date(o.publishDate) : null,
    closesAt: o.responseDate ? new Date(o.responseDate) : null,
    documentUrl: null as string | null,
    listingUrl: `https://sam.gov/opp/${o._id}/view`,
    description: stripHtml(descText ?? ""),
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
