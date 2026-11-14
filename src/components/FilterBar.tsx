"use client";

import Link from "next/link";
import { useState } from "react";

export type FilterSection = { key: string; label: string; options: { key: string; label: string }[]; manage?: { href: string; label: string } };

const chip = (on: boolean) =>
  `flex min-h-11 items-center rounded-full px-4 text-[15px] font-semibold ${on ? "bg-accent text-white" : "bg-surface"}`;

// Filtres repliés derrière un bouton (#5) : sections de pastilles, une valeur par section,
// filtres actifs rappelés en pastilles à retirer, nombre de résultats à droite.
export function FilterBar({
  sections,
  value,
  onChange,
  count,
}: {
  sections: FilterSection[];
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const active = sections.flatMap((s) => {
    const o = s.options.find((o) => o.key === value[s.key]);
    return o ? [{ section: s.key, label: o.label }] : [];
  });
  const toggle = (section: string, key: string) => onChange({ ...value, [section]: value[section] === key ? "" : key });

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Filtres"
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${open ? "bg-accent text-white" : "bg-surface"}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          {active.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white ring-2 ring-bg">
              {active.length}
            </span>
          )}
        </button>
        <ul className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none]">
          {active.map((a) => (
            <li key={a.section} className="shrink-0">
              <button
                type="button"
                onClick={() => onChange({ ...value, [a.section]: "" })}
                aria-label={`Retirer ${a.label}`}
                className="flex h-11 items-center gap-2 whitespace-nowrap rounded-full bg-accent-soft px-4 text-[15px] font-semibold text-accent"
              >
                {a.label}
                <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M1 1l8 8M9 1l-8 8" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
        <span className="shrink-0 text-[14px] text-muted tabular-nums">{count}</span>
      </div>

      {open && (
        <div className="flex flex-col gap-4 rounded-2xl border border-line p-3">
          {sections.map((s) => (
            <fieldset key={s.key}>
              <legend className="mb-2 flex w-full items-center justify-between text-[13px] font-semibold uppercase tracking-wide text-muted">
                {s.label}
                {s.manage && (
                  <Link href={s.manage.href} className="normal-case tracking-normal text-accent">
                    {s.manage.label}
                  </Link>
                )}
              </legend>
              <div className="flex flex-wrap gap-2">
                {s.options.map((o) => (
                  <button key={o.key} type="button" aria-pressed={value[s.key] === o.key} onClick={() => toggle(s.key, o.key)} className={chip(value[s.key] === o.key)}>
                    {o.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          <button type="button" onClick={() => setOpen(false)} className="h-12 rounded-2xl bg-accent text-[16px] font-semibold text-white">
            Voir {count} {count > 1 ? "résultats" : "résultat"}
          </button>
        </div>
      )}
    </>
  );
}

// Garde les filtres dans l'URL sans recharger la page.
export function syncUrl(view: string, value: Record<string, string>) {
  const q = new URLSearchParams({ vue: view });
  for (const [k, v] of Object.entries(value)) if (v) q.set(k, v);
  window.history.replaceState(null, "", `/carnet?${q}`);
}
