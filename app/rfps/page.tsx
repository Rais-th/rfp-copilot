import Link from "next/link";
import { getActiveRfps } from "@/lib/db/queries";

export const revalidate = 300;

export default async function RfpsPage() {
  let rfps: Awaited<ReturnType<typeof getActiveRfps>> = [];
  let errMessage: string | null = null;
  try {
    rfps = await getActiveRfps(100);
  } catch (err) {
    errMessage = (err as Error).message;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="label">Open solicitations</p>
        <h1 className="text-3xl font-medium tracking-tight">
          Memphis RFPs and RFQs
        </h1>
        <p className="text-subtle text-sm max-w-prose">
          Active city solicitations indexed nightly from the Memphis
          procurement portal. Click any row to see the parsed requirements and
          generate a draft response.
        </p>
      </header>

      {errMessage ? (
        <EmptyState
          title="Database not connected"
          body={`Set POSTGRES_URL in .env.local to see live listings. ${errMessage}`}
        />
      ) : rfps.length === 0 ? (
        <EmptyState
          title="No active RFPs indexed yet"
          body="Run the ingestion cron once deployed, or hit /api/cron/ingest-rfps locally with the CRON_SECRET header."
        />
      ) : (
        <div className="card divide-y divide-line">
          {rfps.map((r) => (
            <Link
              key={r.id}
              href={`/rfps/${encodeURIComponent(r.id)}`}
              className="block p-5 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-1 min-w-0">
                  <div className="font-medium truncate">{r.title}</div>
                  <div className="text-xs text-subtle flex items-center gap-3 flex-wrap">
                    {r.agency ? <span>{r.agency}</span> : null}
                    {r.category ? <span>{r.category}</span> : null}
                    <span className="mono">{r.sourceRef}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-subtle">Closes</div>
                  <div className="mono text-sm">
                    {r.closesAt
                      ? new Date(r.closesAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "TBD"}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-10 text-center space-y-2">
      <div className="font-medium">{title}</div>
      <p className="text-subtle text-sm max-w-prose mx-auto">{body}</p>
    </div>
  );
}
