import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "RFP Copilot",
  description:
    "Read Memphis city RFPs and generate compliant response drafts in minutes. Built for MBE/WBE small businesses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b hairline">
          <div className="container-narrow flex items-center justify-between h-14">
            <Link href="/" className="font-medium tracking-tight">
              RFP Copilot
            </Link>
            <nav className="flex items-center gap-6 text-sm text-subtle">
              <Link href="/rfps" className="hover:text-ink">RFPs</Link>
              <Link href="/profile" className="hover:text-ink">Profile</Link>
              <Link href="/about" className="hover:text-ink">About</Link>
              <a
                href="https://github.com/Rais-th/rfp-copilot"
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink"
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>
        <main className="container-narrow py-12">{children}</main>
        <footer className="border-t hairline mt-24">
          <div className="container-narrow py-8 text-xs text-subtle flex items-center justify-between">
            <span>Popuzar LLC. MIT licensed.</span>
            <span>AI-generated drafts. Verify before submission.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
