"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ParsedRfp } from "@/lib/db/schema";
import type { BusinessProfile } from "@/lib/types/profile";

const STORAGE_KEY = "rfp-copilot.profile.v1";

type ValidationReport = {
  overall: "pass" | "warn" | "fail";
  checks: Array<{
    id: string;
    label: string;
    status: "pass" | "warn" | "fail";
    detail: string;
  }>;
  missingSections: string[];
  unsupportedClaims: string[];
  limitOverages: string[];
};

export default function Generator({
  rfpId,
  parsed,
}: {
  rfpId: string;
  parsed: ParsedRfp | null;
}) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [validating, setValidating] = useState(false);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setProfile(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const canGenerate = useMemo(
    () => !!profile?.businessName && !!parsed && !streaming,
    [profile, parsed, streaming],
  );

  async function generate() {
    if (!profile) return;
    setErr(null);
    setDraft("");
    setReport(null);
    setStreaming(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rfpId, profile }),
      });
      if (!res.ok || !res.body) {
        await res.text().catch(() => "");
        throw new Error(
          res.status === 409
            ? "This RFP is not yet parsed. Come back in a minute, or submit the full PDF via Submit RFP."
            : "The draft generator is temporarily unavailable. Try again in a moment."
        );
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        setDraft(buf);
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setStreaming(false);
    }
  }

  async function validate() {
    if (!profile || !draft) return;
    setErr(null);
    setValidating(true);
    setReport(null);
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rfpId, draft, profile }),
      });
      if (!res.ok) {
        throw new Error("Validation service is unavailable. Try again in a moment.");
      }
      setReport(await res.json());
    } catch (e) {
      setErr(friendlyError((e as Error).message));
    } finally {
      setValidating(false);
    }
  }

  async function exportAs(format: "docx" | "md") {
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ draft, filename: `rfp-${rfpId}`, format }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rfp-${safeName(rfpId)}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!parsed) {
    return (
      <div className="card p-6 text-sm text-subtle">
        This RFP is indexed but not yet parsed. The draft generator needs the
        structured requirements first. Run the cron or wait for the next
        nightly ingest.
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[320px_1fr] gap-6">
      <aside className="space-y-4">
        <div className="card p-4 space-y-2">
          <p className="label">Profile</p>
          {profile?.businessName ? (
            <>
              <div className="text-sm font-medium">{profile.businessName}</div>
              <div className="text-xs text-subtle">
                {profile.certifications.join(", ") || "No certifications set"}
              </div>
              <Link
                href="/profile"
                className="text-xs text-subtle hover:text-ink"
              >
                Edit profile
              </Link>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-subtle">
                Set your business profile before generating a draft. Profile
                stays in your browser.
              </p>
              <Link href="/profile" className="btn btn-ghost w-full">
                Set up profile
              </Link>
            </div>
          )}
        </div>
        <div className="card p-4 space-y-2">
          <p className="label">Required sections</p>
          <ol className="space-y-2 text-xs">
            {parsed.requiredSections.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="mono text-subtle">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{s.name}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={generate}
            disabled={!canGenerate}
            className="btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {streaming ? "Generating..." : "Generate draft"}
          </button>
          <button
            onClick={validate}
            disabled={!draft || validating || streaming}
            className="btn btn-ghost disabled:opacity-40"
          >
            {validating ? "Validating..." : "Validate"}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => exportAs("docx")}
              disabled={!draft}
              className="btn btn-ghost flex-1 disabled:opacity-40"
            >
              .docx
            </button>
            <button
              onClick={() => exportAs("md")}
              disabled={!draft}
              className="btn btn-ghost flex-1 disabled:opacity-40"
            >
              .md
            </button>
          </div>
        </div>
      </aside>

      <div className="space-y-4">
        {err ? (
          <div className="card p-4 text-sm text-red-700 bg-red-50 border-red-200">
            {err}
          </div>
        ) : null}

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            streaming
              ? "The draft will stream in here..."
              : "Click Generate draft to produce a response skeleton. Edit it freely before exporting."
          }
          className="w-full min-h-[60vh] card p-5 text-sm leading-relaxed font-mono bg-white focus:outline-none"
          spellCheck
        />

        {report ? <ValidationPanel report={report} /> : null}
      </div>
    </div>
  );
}

function ValidationPanel({ report }: { report: ValidationReport }) {
  const color =
    report.overall === "pass"
      ? "text-emerald-700"
      : report.overall === "warn"
        ? "text-amber-700"
        : "text-red-700";
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="label">Validation report</p>
        <span className={`text-xs font-medium uppercase ${color}`}>
          {report.overall}
        </span>
      </div>
      <ul className="space-y-2 text-sm">
        {report.checks.map((c) => (
          <li key={c.id} className="flex gap-3">
            <StatusDot status={c.status} />
            <div>
              <div className="font-medium">{c.label}</div>
              <div className="text-subtle text-xs">{c.detail}</div>
            </div>
          </li>
        ))}
      </ul>
      {report.missingSections.length > 0 ? (
        <Section title="Missing sections" items={report.missingSections} />
      ) : null}
      {report.unsupportedClaims.length > 0 ? (
        <Section
          title="Unsupported claims"
          items={report.unsupportedClaims}
        />
      ) : null}
      {report.limitOverages.length > 0 ? (
        <Section title="Limit overages" items={report.limitOverages} />
      ) : null}
    </div>
  );
}

function StatusDot({ status }: { status: "pass" | "warn" | "fail" }) {
  const c =
    status === "pass"
      ? "bg-emerald-500"
      : status === "warn"
        ? "bg-amber-500"
        : "bg-red-500";
  return <span className={`mt-2 inline-block w-1.5 h-1.5 rounded-full ${c}`} />;
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-1.5">
      <p className="label">{title}</p>
      <ul className="text-xs text-subtle space-y-1">
        {items.map((it, i) => (
          <li key={i}>{"• "}{it}</li>
        ))}
      </ul>
    </div>
  );
}

function safeName(s: string) {
  return s.replace(/[^a-z0-9\-_.]/gi, "-");
}

function friendlyError(msg: string): string {
  if (!msg) return "Something went wrong.";
  if (msg.startsWith("{") || msg.includes("error")) {
    return "Something went wrong with the validation. Try again.";
  }
  return msg;
}
