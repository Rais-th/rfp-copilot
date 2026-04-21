import { notFound } from "next/navigation";
import Link from "next/link";
import { getRfpById } from "@/lib/db/queries";
import Generator from "./Generator";

export const dynamic = "force-dynamic";

export default async function GeneratePage({
  params,
}: {
  params: Promise<{ rfpId: string }>;
}) {
  const { rfpId } = await params;
  const id = decodeURIComponent(rfpId);
  const rfp = await getRfpById(id).catch(() => null);
  if (!rfp) notFound();

  return (
    <div className="space-y-6">
      <Link href={`/rfps/${encodeURIComponent(rfp.id)}`} className="text-xs text-subtle hover:text-ink">
        {"←"} Back to RFP
      </Link>
      <header className="space-y-1">
        <p className="label">Draft generator</p>
        <h1 className="text-2xl font-medium tracking-tight">{rfp.title}</h1>
      </header>
      <Generator rfpId={rfp.id} parsed={rfp.parsed} />
    </div>
  );
}
