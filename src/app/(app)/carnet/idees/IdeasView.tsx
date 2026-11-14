"use client";

import { useState } from "react";
import type { Idea } from "@/lib/ideas";
import { IdeaList } from "./IdeaList";

type Filter = { key: string; label: string; keep: (i: Idea) => boolean };

// Filtres des idées (SPEC §8.10) : catégories, plus Pistes et Sans personne.
// Filtrage côté navigateur : instantané, sans recharger la page.
export function IdeasView({ ideas, categories, initial }: { ideas: Idea[]; categories: readonly string[]; initial: string }) {
  const filters: Filter[] = [
    { key: "", label: "Toutes", keep: () => true },
    { key: "pistes", label: "Pistes", keep: (i) => i.is_lead },
    { key: "a-trier", label: "Sans personne", keep: (i) => i.recipients.length === 0 },
    ...categories.map((c) => ({ key: c, label: c, keep: (i: Idea) => i.category === c })),
  ];
  const [key, setKey] = useState(filters.some((f) => f.key === initial) ? initial : "");
  const active = filters.find((f) => f.key === key)!;

  function choose(next: string) {
    setKey(next);
    const url = next ? `/carnet?vue=idees&filtre=${encodeURIComponent(next)}` : "/carnet?vue=idees";
    window.history.replaceState(null, "", url);
  }

  return (
    <>
      <ul aria-label="Filtres" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {filters.map((f) => {
          const on = f.key === key;
          return (
            <li key={f.key || "toutes"} className="shrink-0">
              <button
                type="button"
                onClick={() => choose(f.key)}
                aria-pressed={on}
                className={`flex h-11 items-center whitespace-nowrap rounded-full px-4 text-[15px] font-semibold ${on ? "bg-ink text-white" : "bg-surface"}`}
              >
                {f.label}
              </button>
            </li>
          );
        })}
      </ul>
      <IdeaList ideas={ideas.filter(active.keep)} />
    </>
  );
}
