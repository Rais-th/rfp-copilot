export async function fetchDocumentText(
  url: string,
): Promise<{ text: string; contentType: string } | null> {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (RFP-Copilot/0.1; +https://github.com/Rais-th/rfp-copilot)",
      accept: "*/*",
    },
    redirect: "follow",
  });
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") ?? "";
  const lower = url.toLowerCase();

  if (contentType.includes("pdf") || lower.endsWith(".pdf")) {
    const buf = Buffer.from(await res.arrayBuffer());
    const { default: pdfParse } = await import("pdf-parse");
    const parsed = await pdfParse(buf);
    return { text: parsed.text ?? "", contentType: "application/pdf" };
  }
  if (contentType.includes("html") || contentType.includes("text")) {
    const html = await res.text();
    return { text: stripHtml(html), contentType };
  }
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
