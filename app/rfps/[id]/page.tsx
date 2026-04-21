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
          <Meta label="Source ref" value={rfp.sourceRef} mono />
          <Meta label="Agency" value={rfp.agency ?? "Unspecified"} />
          <Meta label="Category" value={rfp.category ?? "Unspecified"} />
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
        <div className="flex gap-3 pt-2">
          <Link
            href={`/generate/${encodeURIComponent(rfp.id)}`}
            className="btn btn-primary"
          >
            Generate draft
          </Link>
          {rfp.documentUrl ? (
            <a
              href={rfp.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
            >
              View source document
            </a>
          ) : null}
        </div>
      </header>

      {parsed ? (
        <section className="space-y-8">
          <Panel title="Summary">
            <p className="text-sm leading-relaxed text-ink/80">
              {parsed.summary}
            </p>
          </Panel>

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
            <Panel title="Qualifications">
              <List items={parsed.qualifications} />
            </Panel>
            <Panel title="Evaluation criteria">
              <List items={parsed.evaluationCriteria} />
            </Panel>
          </div>

          <Panel title="Required attachments">
            <List items={parsed.requiredAttachments} />
          </Panel>

          {parsed.submissionInstructions ? (
            <Panel title="Submission instructions">
              <p className="text-sm leading-relaxed text-ink/80">
                {parsed.submissionInstructions}
              </p>
            </Panel>
          ) : null}
        </section>
      ) : (
        <div className="card p-8 text-sm text-subtle">
          This RFP has been indexed but the structured parse is still pending.
          Once the document is parsed, you will see required sections,
          qualifications, and evaluation criteria here.
        </div>
      )}
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
          <span className="text-subtle mono text-xs mt-1">
            {"•"}
          </span>
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
