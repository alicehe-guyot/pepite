"use client";

import { useState } from "react";
import { ShareButton } from "@/components/ShareButton";

// Brief Instinct : on choisit l'occasion (le prochain événement par défaut), puis on copie.
export function BriefButton({ briefs }: { briefs: { key: string; label: string; text: string }[] }) {
  const [key, setKey] = useState(briefs[0]?.key);
  const brief = briefs.find((b) => b.key === key) ?? briefs[0];
  return (
    <div className="flex flex-col gap-2 md:max-w-2xl">
      <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">Brief pour</span>
      <div className="flex flex-wrap gap-2">
        {briefs.map((b) => (
          <button
            key={b.key}
            type="button"
            aria-pressed={b.key === key}
            onClick={() => setKey(b.key)}
            className={`flex min-h-11 items-center rounded-full px-4 text-[15px] font-semibold ${b.key === key ? "bg-ink text-white" : "bg-surface"}`}
          >
            {b.label}
          </button>
        ))}
      </div>
      <ShareButton text={brief.text} label="Copier le brief" copy />
    </div>
  );
}
