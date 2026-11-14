"use client";

import { useState } from "react";

// Brief Instinct : choisir l'occasion (le prochain événement par défaut), puis copier. Une seule ligne.
export function BriefButton({ briefs }: { briefs: { key: string; label: string; text: string }[] }) {
  const [key, setKey] = useState(briefs[0]?.key);
  const [copied, setCopied] = useState(false);
  const brief = briefs.find((b) => b.key === key) ?? briefs[0];
  async function copy() {
    await navigator.clipboard.writeText(brief.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="flex items-center gap-2 md:max-w-xl">
      <select
        value={key}
        onChange={(e) => setKey(e.target.value)}
        aria-label="Brief pour quelle occasion"
        className="h-11 min-w-0 flex-1 rounded-xl bg-surface px-3 text-[15px] font-semibold outline-accent"
      >
        {briefs.map((b) => (
          <option key={b.key} value={b.key}>
            {b.label}
          </option>
        ))}
      </select>
      <button type="button" onClick={copy} className="h-11 shrink-0 rounded-xl bg-accent px-4 text-[15px] font-semibold text-white">
        {copied ? "Copié" : "Copier le brief"}
      </button>
    </div>
  );
}
