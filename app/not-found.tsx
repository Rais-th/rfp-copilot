import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-prose space-y-4 py-12">
      <p className="label">404</p>
      <h1 className="text-2xl font-medium tracking-tight">Not found</h1>
      <p className="text-subtle text-sm">
        That page does not exist. The RFP may have closed and been removed, or
        the URL is incorrect.
      </p>
      <Link href="/rfps" className="btn btn-ghost">
        See open RFPs
      </Link>
    </div>
  );
}
