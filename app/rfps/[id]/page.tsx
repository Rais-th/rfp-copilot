import Link from "next/link";
import { notFound } from "next/navigation";
import { getRfpById } from "@/lib/db/queries";

export const revalidate = 300;

export default async function RfpDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rfp = await getRfpById(decodeURIComponent(id)).catch(() => null);
  if (!rfp) notFound();

  const parsed = rfp.parsed;
  const hasStructuredParse =
    !!parsed && Array.isArray(parsed.requiredSections) && parsed.requiredSections.length > 0;
  const sourceLink = rfp.listingUrl ?? rfp.documentUrl;
  const isSam = rfp.source === "sam";

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <Link href="/rfps" className="text-xs text-subtle hover:text-ink">
          {"←"} All RFPs
        </Link>
        <h1 className="text-2xl md:text-3xl font-medium tracking-tight leading-tight">
          {rfp.title}
        </h1>
        <div className="flex flex-wrap gap-4 text-xs text-subtle">
          <Meta
            label="Source"
            value={isSam ? "SAM.gov" : rfp.source}
          />
          {rfp.agency ? <Meta label="Agency" value={rfp.agency} /> : null}
          {rfp.category ? <Meta label="Category" value={rfp.category} /> : null}
          <Meta
            label="Closes"
            value={
              rfp.closesAt
                ? new Date(rfp.closesAt).toLocaleDateString()
                : "TBD"
            }
            mono
          />
        </div>
        <div className="flex gap-3 pt-2 flex-wrap">
          <Link
            href={`/generate/${encodeURIComponent(rfp.id)}`}
            className="btn btn-primary"
          >
            Generate draft
          </Link>
          {sourceLink ? (
            <a
              href={sourceLink}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
            >
              {isSam ? "View on SAM.gov" : "View source document"}
            </a>
          ) : null}
        </div>
      </header>

      {parsed?.summary ? (
        <Panel title="Summary">
          <p className="text-sm leading-relaxed text-ink/80">
            {parsed.summary}
          </p>
        </Panel>
      ) : null}

      {hasStructuredParse ? (
        <StructuredSections parsed={parsed!} />
      ) : (
        <EmptyParseState
          source={isSam ? "SAM.gov" : rfp.source}
          sourceLink={sourceLink}
          rawText={rfp.rawText}
        />
      )}
    </div>
  );
}

function StructuredSections({
  parsed,
}: {
  parsed: NonNullable<Awaited<ReturnType<typeof getRfpById>>>["parsed"];
}) {
  if (!parsed) return null;
  return (
    <section className="space-y-8">
      <Panel title="Required sections">
        <ol className="space-y-3 text-sm">
          {parsed.requiredSections.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="mono text-xs text-subtle mt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="font-medium">
                  {s.name}
                  {s.pageLimit ? (
                    <span className="ml-2 text-xs text-subtle font-normal">
                      max {s.pageLimit} pages
                    </span>
                  ) : null}
                  {s.wordLimit ? (
                    <span className="ml-2 text-xs text-subtle font-normal">
                      max {s.wordLimit} words
                    </span>
                  ) : null}
                </div>
                <p className="text-subtle mt-0.5">{s.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid md:grid-cols-2 gap-6">
        {parsed.qualifications?.length ? (
          <Panel title="Qualifications">
            <List items={parsed.qualifications} />
          </Panel>
        ) : null}
        {parsed.evaluationCriteria?.length ? (
          <Panel title="Evaluation criteria">
            <List items={parsed.evaluationCriteria} />
          </Panel>
        ) : null}
      </div>

      {parsed.requiredAttachments?.length ? (
        <Panel title="Required attachments">
          <List items={parsed.requiredAttachments} />
        </Panel>
      ) : null}

      {parsed.submissionInstructions ? (
        <Panel title="Submission instructions">
          <p className="text-sm leading-relaxed text-ink/80">
            {parsed.submissionInstructions}
          </p>
        </Panel>
      ) : null}
    </section>
  );
}

function EmptyParseState({
  source,
  sourceLink,
  rawText,
}: {
  source: string;
  sourceLink: string | null;
  rawText: string | null;
}) {
  const preview =
    rawText && rawText.length > 0
      ? rawText.slice(0, 2000) + (rawText.length > 2000 ? "…" : "")
      : null;

  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-3">
        <p className="label">Structured requirements not available</p>
        <p className="text-sm leading-relaxed text-ink/80">
          The {source} listing does not expose a full solicitation PDF for
          machine parsing. For a complete draft, download the official
          solicitation documents from the source link, then submit the PDF
          directly below for a full structured parse.
        </p>
        <div className="flex gap-2 pt-1 flex-wrap">
          {sourceLink ? (
            <a
              href={sourceLink}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              Open solicitation on {source}
            </a>
          ) : null}
          <Link href="/rfps/new" className="btn btn-ghost">
            Submit full PDF
          </Link>
        </div>
      </div>

      {preview ? (
        <Panel title="Listing summary">
          <p className="text-sm leading-relaxed text-ink/80 whitespace-pre-wrap">
            {preview}
          </p>
        </Panel>
      ) : null}
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6 space-y-3">
      <p className="label">{title}</p>
      {children}
    </div>
  );
}

function List({ items }: { items: string[] }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-subtle">None specified.</p>;
  }
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-subtle mono text-xs mt-1">{"•"}</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className={mono ? "mono text-ink text-sm" : "text-ink text-sm"}>
        {value}
      </div>
    </div>
  );
}
