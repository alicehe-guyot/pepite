"use client";

import { useState } from "react";
import { FilterBar, syncUrl, type FilterSection } from "@/components/FilterBar";
import type { Idea } from "@/lib/ideas";
import { IdeaList } from "./IdeaList";

// Un choix « Pour qui » : une idée correspond si un de ses destinataires est dans ces listes.
// Personne : elle-même et ses groupes. Groupe : lui-même et ses membres.
export type WhoOption = { key: string; label: string; kind: "person" | "group"; personIds: string[]; groupIds: string[] };

type Filters = Record<string, string>;

// Regroupe par destinataires (retour Alice #42) : une section par personne ou ensemble de
// personnes, « Moi » d'abord, « Sans personne » à la fin. Une idée n'apparaît qu'une fois.
function byRecipients(ideas: Idea[]): [string, Idea[]][] {
  const groups = new Map<string, Idea[]>();
  for (const i of ideas) {
    const who = i.recipients.map((r) => r.name).join(", ") || "Sans personne";
    groups.set(who, [...(groups.get(who) ?? []), i]);
  }
  const rank = (w: string) => (w === "Moi" ? 0 : w === "Sans personne" ? 2 : 1);
  return [...groups].sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b, "fr"));
}

// « Récents » : par jour d'ajout, le plus récent d'abord (pour vérifier une capture ou repérer un doublon).
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" });
const dayLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
function byDay(ideas: Idea[]): [string, Idea[]][] {
  const now = new Date();
  const today = dayKey.format(now);
  const yesterday = dayKey.format(new Date(now.getTime() - 86_400_000));
  const days = new Map<string, Idea[]>();
  for (const i of [...ideas].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    const d = new Date(i.created_at);
    const k = dayKey.format(d);
    const label = k === today ? "Aujourd'hui" : k === yesterday ? "Hier" : dayLabel.format(d);
    days.set(label, [...(days.get(label) ?? []), i]);
  }
  return [...days];
}

const ORDERS = [
  { key: "", label: "Par personne" },
  { key: "recents", label: "Récents" },
];

export function IdeasView({
  ideas,
  categories,
  who,
  initial,
  traits,
}: {
  traits: Record<string, string[]>;
  ideas: Idea[];
  categories: readonly string[];
  who: WhoOption[];
  initial: Filters;
}) {
  const [f, setF] = useState<Filters>(initial);
  const person = who.find((w) => w.key === f.qui);
  const shown = ideas.filter(
    (i) =>
      (!person || i.recipients.some((r) => (r.kind === "person" ? person.personIds : person.groupIds).includes(r.id))) &&
      (f.statut !== "a-trier" || i.recipients.length === 0) &&
      (!f.cat || i.categories.includes(f.cat)) &&
      (!f.genre || traits[i.id]?.includes(f.genre)) &&
      (!f.age || traits[i.id]?.includes(f.age)),
  );
  const sections: FilterSection[] = [
    { key: "qui", label: "Pour qui", options: who.map((w) => ({ key: w.key, label: w.label })) },
    { key: "genre", label: "Femme ou homme", options: [{ key: "female", label: "Femme" }, { key: "male", label: "Homme" }] },
    { key: "age", label: "Adulte ou enfant", options: [{ key: "adult", label: "Adulte" }, { key: "child", label: "Enfant" }] },
    { key: "statut", label: "Statut", options: [{ key: "a-trier", label: "Sans personne" }] },
    { key: "cat", label: "Catégorie", options: categories.map((c) => ({ key: c, label: c })), manage: { href: "/carnet/categories", label: "Modifier" } },
  ];

  return (
    <>
      <FilterBar
        sections={sections}
        value={f}
        count={shown.length}
        onChange={(next) => {
          setF(next);
          syncUrl("idees", next);
        }}
      />

      <nav aria-label="Ranger les idées" className="flex gap-1 rounded-2xl bg-surface p-1 md:max-w-sm">
        {ORDERS.map((o) => {
          const on = (f.tri ?? "") === o.key;
          return (
            <button
              key={o.key || "personne"}
              type="button"
              aria-pressed={on}
              onClick={() => {
                const next = { ...f, tri: o.key };
                setF(next);
                syncUrl("idees", next);
              }}
              className={`flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-semibold ${on ? "bg-bg text-accent shadow-sm" : "text-muted"}`}
            >
              {o.label}
            </button>
          );
        })}
      </nav>

      {shown.length === 0 ? (
        <p className="text-muted">Aucune idée</p>
      ) : (
        (f.tri === "recents" ? byDay(shown) : byRecipients(shown)).map(([who, list]) => (
          <details key={who} open className="group/s flex flex-col gap-2">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="shrink-0 transition-transform group-open/s:rotate-90">
                <path d="M4 2l4 4-4 4" />
              </svg>
              <h2 className="truncate font-display text-lg font-bold first-letter:uppercase">{who}</h2>
              <span className="text-[14px] text-muted">{list.length}</span>
            </summary>
            <IdeaList ideas={list} />
          </details>
        ))
      )}
    </>
  );
}
