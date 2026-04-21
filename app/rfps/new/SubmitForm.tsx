"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "url" | "upload";

export default function SubmitForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    setStage("Fetching document.");
    try {
      let res: Response;
      if (mode === "url") {
        res = await fetch("/api/rfps/submit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url, title: title || undefined }),
        });
      } else {
        if (!file) {
          setErr("Choose a PDF file.");
          setBusy(false);
          return;
        }
        const form = new FormData();
        form.append("file", file);
        if (title) form.append("title", title);
        res = await fetch("/api/rfps/submit", { method: "POST", body: form });
      }
      setStage("Parsing requirements with Claude.");
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      router.push(`/rfps/${encodeURIComponent(json.id)}`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
      setStage(null);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex gap-2 p-1 bg-white border hairline rounded-md w-fit">
        {(["url", "upload"] as Mode[]).map((m) => (
          <button
            type="button"
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 h-8 rounded text-sm font-medium transition ${
              mode === m ? "bg-ink text-paper" : "text-subtle hover:text-ink"
            }`}
          >
            {m === "url" ? "Paste URL" : "Upload PDF"}
          </button>
        ))}
      </div>

      {mode === "url" ? (
        <Field label="Public URL to RFP PDF or HTML" required>
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="input"
          />
        </Field>
      ) : (
        <Field label="PDF file (max 10 MB)" required>
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="application/pdf"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <div className="border-2 border-dashed border-line rounded-md p-6 text-center text-sm text-subtle hover:border-ink">
              {file ? (
                <span className="text-ink font-medium">{file.name}</span>
              ) : (
                "Click to choose a PDF"
              )}
            </div>
          </label>
        </Field>
      )}

      <Field label="Title (optional)">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="If empty, we derive it from the document"
          className="input"
        />
      </Field>

      {err ? (
        <div className="card p-3 text-sm text-red-700 bg-red-50 border-red-200">
          {err}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <div className="text-xs text-subtle">
          {busy ? stage : "Parse takes about 30 seconds with Claude."}
        </div>
        <button type="submit" disabled={busy} className="btn btn-primary disabled:opacity-50">
          {busy ? "Parsing..." : "Submit"}
        </button>
      </div>

      <style>{`
        .input {
          display: block;
          width: 100%;
          height: 2.25rem;
          padding: 0 0.75rem;
          border: 1px solid #e5e5e5;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          background: #fff;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus {
          border-color: #0a0a0a;
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-ink">
        {label}
        {required ? <span className="text-subtle"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
