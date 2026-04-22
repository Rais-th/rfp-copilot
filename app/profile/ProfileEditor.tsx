"use client";

import { useEffect, useState } from "react";
import type { BusinessProfile } from "@/lib/types/profile";

const STORAGE_KEY = "rfp-copilot.profile.v1";

const emptyProfile: BusinessProfile = {
  businessName: "",
  contactName: "",
  contactEmail: "",
  yearsInBusiness: undefined,
  teamSize: undefined,
  naicsCodes: [],
  certifications: [],
  keyPersonnel: [],
  pastWork: [],
  capabilities: "",
  differentiators: "",
};

const CERTS = [
  "MBE",
  "WBE",
  "DBE",
  "8a",
  "HUBZone",
  "VOSB",
  "SDVOSB",
  "LGBTBE",
] as const;

export default function ProfileEditor() {
  const [profile, setProfile] = useState<BusinessProfile>(emptyProfile);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setProfile({ ...emptyProfile, ...JSON.parse(raw) });
      } catch {
        /* ignore */
      }
    }
    setLoaded(true);
  }, []);

  function update<K extends keyof BusinessProfile>(
    key: K,
    value: BusinessProfile[K],
  ) {
    setProfile((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function download() {
    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "business-profile.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        setProfile({ ...emptyProfile, ...data });
        setSaved(false);
      } catch {
        /* ignore */
      }
    };
    reader.readAsText(file);
  }

  if (!loaded) {
    return <div className="card p-6 text-sm text-subtle">Loading profile.</div>;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-6"
    >
      <Section title="Business">
        <Field label="Business name" required>
          <input
            value={profile.businessName}
            onChange={(e) => update("businessName", e.target.value)}
            className="input"
            required
          />
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Contact name">
            <input
              value={profile.contactName ?? ""}
              onChange={(e) => update("contactName", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Contact email">
            <input
              type="email"
              value={profile.contactEmail ?? ""}
              onChange={(e) => update("contactEmail", e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Years in business">
            <input
              type="number"
              min={0}
              value={profile.yearsInBusiness ?? ""}
              onChange={(e) =>
                update(
                  "yearsInBusiness",
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
              className="input"
            />
          </Field>
          <Field label="Team size">
            <input
              type="number"
              min={0}
              value={profile.teamSize ?? ""}
              onChange={(e) =>
                update(
                  "teamSize",
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
              className="input"
            />
          </Field>
        </div>
      </Section>

      <Section title="Classifications">
        <Field label="NAICS codes (comma separated)">
          <input
            value={profile.naicsCodes.join(", ")}
            onChange={(e) =>
              update(
                "naicsCodes",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            className="input"
            placeholder="541511, 541512"
          />
        </Field>
        <Field label="Certifications">
          <div className="flex flex-wrap gap-2">
            {CERTS.map((c) => {
              const active = profile.certifications.includes(c);
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() =>
                    update(
                      "certifications",
                      active
                        ? profile.certifications.filter((x) => x !== c)
                        : [...profile.certifications, c],
                    )
                  }
                  className={`px-3 h-8 rounded-md border text-xs font-medium transition ${
                    active
                      ? "bg-ink text-paper border-ink"
                      : "bg-white border-line hover:border-ink"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Field>
      </Section>

      <Section title="Capabilities">
        <Field label="Core capabilities">
          <textarea
            value={profile.capabilities}
            onChange={(e) => update("capabilities", e.target.value)}
            className="input min-h-24 py-2"
            placeholder="What services your business delivers."
          />
        </Field>
        <Field label="Differentiators">
          <textarea
            value={profile.differentiators}
            onChange={(e) => update("differentiators", e.target.value)}
            className="input min-h-24 py-2"
            placeholder="What sets you apart. Community ties, cost, speed, specialization."
          />
        </Field>
      </Section>

      <Section title="Past work (optional)">
        <PastWorkEditor
          items={profile.pastWork}
          onChange={(next) => update("pastWork", next)}
        />
      </Section>

      <div className="h-20" aria-hidden />

      <div className="fixed left-0 right-0 bottom-0 bg-paper border-t hairline z-20">
        <div className="container-narrow flex items-center justify-between py-3 gap-3 flex-wrap">
          <div className="text-xs text-subtle">
            {saved ? "Saved to your browser." : "Changes are not saved yet."}
          </div>
          <div className="flex gap-2">
            <label className="btn btn-ghost cursor-pointer">
              Import JSON
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={upload}
              />
            </label>
            <button type="button" onClick={download} className="btn btn-ghost">
              Export JSON
            </button>
            <button type="submit" className="btn btn-primary">
              Save profile
            </button>
          </div>
        </div>
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
          background: #ffffff;
          color: #0a0a0a;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus {
          border-color: #0a0a0a;
        }
        textarea.input {
          height: auto;
          resize: vertical;
        }
      `}</style>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6 space-y-4">
      <p className="label">{title}</p>
      {children}
    </div>
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

function PastWorkEditor({
  items,
  onChange,
}: {
  items: BusinessProfile["pastWork"];
  onChange: (next: BusinessProfile["pastWork"]) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border hairline rounded-md p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="Project title"
              value={item.title}
              onChange={(e) =>
                onChange(
                  items.map((it, j) =>
                    j === i ? { ...it, title: e.target.value } : it,
                  ),
                )
              }
            />
            <input
              className="input"
              placeholder="Client"
              value={item.client}
              onChange={(e) =>
                onChange(
                  items.map((it, j) =>
                    j === i ? { ...it, client: e.target.value } : it,
                  ),
                )
              }
            />
            <input
              className="input"
              placeholder="Value (e.g. $120k)"
              value={item.value ?? ""}
              onChange={(e) =>
                onChange(
                  items.map((it, j) =>
                    j === i ? { ...it, value: e.target.value } : it,
                  ),
                )
              }
            />
            <input
              className="input"
              placeholder="Year"
              value={item.year ?? ""}
              onChange={(e) =>
                onChange(
                  items.map((it, j) =>
                    j === i ? { ...it, year: e.target.value } : it,
                  ),
                )
              }
            />
          </div>
          <textarea
            className="input min-h-16 py-2"
            placeholder="Short summary of scope and outcome"
            value={item.summary ?? ""}
            onChange={(e) =>
              onChange(
                items.map((it, j) =>
                  j === i ? { ...it, summary: e.target.value } : it,
                ),
              )
            }
          />
          <button
            type="button"
            className="text-xs text-subtle hover:text-ink"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...items,
            { title: "", client: "", value: "", year: "", summary: "" },
          ])
        }
        className="btn btn-ghost"
      >
        Add past project
      </button>
    </div>
  );
}
