"use client";

import { useState } from "react";
import type { Idea } from "@/lib/ideas";
import { IdeaList } from "./IdeaList";

// Un choix « Pour qui » : une idée correspond si un de ses destinataires est dans ces listes.
// Personne : elle-même et ses groupes. Groupe : lui-même et ses membres.
export type WhoOption = { key: string; label: string; kind: "person" | "group"; personIds: string[]; groupIds: string[] };

const STATUSES: { key: string; label: string; keep: (i: Idea) => boolean }[] = [
  { key: "pistes", label: "Pistes", keep: (i) => i.is_lead },
  { key: "a-trier", label: "Sans personne", keep: (i) => i.recipients.length === 0 },
];

type Filters = { qui: string; statut: string; cat: string };

const chip = (on: boolean) =>
  `flex min-h-11 items-center rounded-full px-4 text-[15px] font-semibold ${on ? "bg-ink text-white" : "bg-surface"}`;
const legend = "mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted";

export function IdeasView({
  ideas,
  categories,
  who,
  initial,
}: {
  ideas: Idea[];
  categories: readonly string[];
  who: WhoOption[];
  initial: Filters;
}) {
  const [f, setF] = useState<Filters>(initial);
  const [open, setOpen] = useState(false);

  const person = who.find((w) => w.key === f.qui);
  const status = STATUSES.find((s) => s.key === f.statut);
  const shown = ideas.filter(
    (i) =>
      (!person || i.recipients.some((r) => (r.kind === "person" ? person.personIds : person.groupIds).includes(r.id))) &&
      (!status || status.keep(i)) &&
      (!f.cat || i.category === f.cat),
  );
  const active = [person && { k: "qui", label: person.label }, status && { k: "statut", label: status.label }, f.cat && { k: "cat", label: f.cat }].filter(
    Boolean,
  ) as { k: keyof Filters; label: string }[];

  function update(next: Filters) {
    setF(next);
    const q = new URLSearchParams({ vue: "idees" });
    for (const [k, v] of Object.entries(next)) if (v) q.set(k, v);
    window.history.replaceState(null, "", `/carnet?${q}`);
  }
  const toggle = (k: keyof Filters, v: string) => update({ ...f, [k]: f[k] === v ? "" : v });

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Filtres"
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${open ? "bg-ink text-white" : "bg-surface"}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          {active.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
              {active.length}
            </span>
          )}
        </button>
        <ul className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none]">
          {active.map((a) => (
            <li key={a.k} className="shrink-0">
              <button
                type="button"
                onClick={() => update({ ...f, [a.k]: "" })}
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
        <span className="shrink-0 text-[14px] text-muted tabular-nums">{shown.length}</span>
      </div>

      {open && (
        <div className="flex flex-col gap-4 rounded-2xl border border-line p-3">
          <fieldset>
            <legend className={legend}>Pour qui</legend>
            <div className="flex flex-wrap gap-2">
              {who.map((w) => (
                <button key={w.key} type="button" aria-pressed={f.qui === w.key} onClick={() => toggle("qui", w.key)} className={chip(f.qui === w.key)}>
                  {w.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={legend}>Statut</legend>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button key={s.key} type="button" aria-pressed={f.statut === s.key} onClick={() => toggle("statut", s.key)} className={chip(f.statut === s.key)}>
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={legend}>Catégorie</legend>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button key={c} type="button" aria-pressed={f.cat === c} onClick={() => toggle("cat", c)} className={chip(f.cat === c)}>
                  {c}
                </button>
              ))}
            </div>
          </fieldset>
          <button type="button" onClick={() => setOpen(false)} className="h-12 rounded-2xl bg-accent text-[16px] font-semibold text-white">
            Voir {shown.length} {shown.length > 1 ? "idées" : "idée"}
          </button>
        </div>
      )}

      <IdeaList ideas={shown} />
    </>
  );
}
