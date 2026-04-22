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
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="label">Open solicitations</p>
          <h1 className="text-3xl font-medium tracking-tight">
            Active RFPs
          </h1>
          <p className="text-subtle text-sm max-w-prose">
            Indexed nightly from SAM.gov, filtered for Tennessee. Click any
            row to see the parsed requirements and generate a draft response.
            You can also submit any RFP URL or PDF directly.
          </p>
        </div>
        <Link href="/rfps/new" className="btn btn-primary shrink-0">
          Submit RFP
        </Link>
      </header>

      {errMessage ? (
        <EmptyState
          title="Database not connected"
          body={`Set POSTGRES_URL in .env.local to see live listings. ${errMessage}`}
        />
      ) : rfps.length === 0 ? (
        <div className="card p-10 text-center space-y-3">
          <div className="font-medium">No active RFPs indexed yet</div>
          <p className="text-subtle text-sm max-w-prose mx-auto">
            The nightly ingest runs at 06:00 CT. You can also submit any RFP
            URL or PDF right now to parse it on demand.
          </p>
          <div className="pt-2">
            <Link href="/rfps/new" className="btn btn-primary">
              Submit an RFP
            </Link>
          </div>
        </div>
      ) : (
        <div className="card divide-y divide-line">
          {rfps.map((r) => {
            const sourceLabel =
              r.source === "sam"
                ? "SAM.gov"
                : r.source === "upload"
                  ? "Uploaded"
                  : r.source === "url"
                    ? "Submitted"
                    : r.source;
            const daysLeft = r.closesAt
              ? Math.ceil(
                  (new Date(r.closesAt).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24),
                )
              : null;
            const urgent = daysLeft !== null && daysLeft <= 7;
            return (
              <Link
                key={r.id}
                href={`/rfps/${encodeURIComponent(r.id)}`}
                className="block p-5 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="font-medium leading-snug">{r.title}</div>
                    <div className="text-xs text-subtle flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-stone-100 text-ink/70 text-[11px] font-medium">
                        {sourceLabel}
                      </span>
                      {r.agency ? <span>{r.agency}</span> : null}
                      {r.category ? <span>{r.category}</span> : null}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-subtle">Closes</div>
                    <div
                      className={`mono text-sm ${urgent ? "text-red-700 font-medium" : ""}`}
                    >
                      {r.closesAt
                        ? new Date(r.closesAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "TBD"}
                    </div>
                    {daysLeft !== null && daysLeft >= 0 ? (
                      <div
                        className={`text-[11px] mt-0.5 ${urgent ? "text-red-700" : "text-subtle"}`}
                      >
                        {daysLeft === 0
                          ? "today"
                          : daysLeft === 1
                            ? "1 day left"
                            : `${daysLeft} days left`}
                      </div>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
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
