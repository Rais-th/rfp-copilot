import Link from "next/link";
import { getActiveRfpsCount } from "@/lib/db/queries";

export const revalidate = 3600;

export default async function HomePage() {
  let activeCount = 0;
  try {
    activeCount = await getActiveRfpsCount();
  } catch {
    activeCount = 0;
  }

  return (
    <div className="space-y-24">
      <section className="space-y-6 max-w-2xl">
        <p className="label">Civic AI infrastructure</p>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1]">
          Win public sector contracts. In hours, not days.
        </h1>
        <p className="text-subtle text-lg leading-relaxed">
          RFP Copilot reads a solicitation PDF and generates a compliant
          response skeleton mapped to your business profile. Built for
          minority and women owned small businesses chasing city, county, and
          federal contracts. Open source. No account. Your business data
          stays on your machine.
        </p>
        <div className="flex gap-3 pt-2 flex-wrap">
          <Link href="/rfps/new" className="btn btn-primary">
            Submit an RFP
          </Link>
          <Link href="/rfps" className="btn btn-ghost">
            Browse open RFPs
          </Link>
          <Link href="/about" className="btn btn-ghost">
            How it works
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line rounded-lg overflow-hidden border hairline">
        <Stat value={String(activeCount)} label="Active RFPs indexed" />
        <Stat value="< 5 min" label="Median draft generation time" />
        <Stat value="100%" label="MBE/WBE focused" />
      </section>

      <section className="max-w-xl space-y-4">
        <p className="label">What it does</p>
        <ol className="space-y-4 text-sm leading-relaxed">
          <Step n={1} title="Ingests solicitations">
            Daily pull of federal opportunities from SAM.gov, filtered for
            Tennessee and matching NAICS codes. Or paste any solicitation URL
            or upload the PDF directly.
          </Step>
          <Step n={2} title="Matches your business profile">
            Your SBA certifications, NAICS codes, and past work live in your
            browser only. Nothing is sent to a server you don't control.
          </Step>
          <Step n={3} title="Drafts a compliant skeleton">
            Sections come back in the required order with fill in markers for
            anything unique to your business. Validate against the RFP
            evaluation criteria before you export.
          </Step>
        </ol>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white p-6">
      <div className="text-3xl font-medium tracking-tight">{value}</div>
      <div className="text-xs text-subtle mt-2">{label}</div>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="mono text-xs text-subtle mt-1">0{n}</span>
      <div>
        <div className="font-medium">{title}</div>
        <p className="text-subtle mt-1">{children}</p>
      </div>
    </li>
  );
}
