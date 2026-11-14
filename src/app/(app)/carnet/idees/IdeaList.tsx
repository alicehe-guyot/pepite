"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Idea } from "@/lib/ideas";
import { RatingPicker } from "../offerts/RatingPicker";
import { markGiven } from "./actions";
import { DeleteButton } from "./DeleteButton";

// Une ligne par idée : titre, destinataires, catégorie. Les pistes sont sur fond soleil.
// Coche : passer en offerte, la note est demandée tout de suite (« Plus tard » possible).
function IdeaRow({ idea: i }: { idea: Idea }) {
  const [giving, setGiving] = useState(false);
  const [pending, start] = useTransition();
  const details = [i.recipients.map((r) => r.name).join(", ") || "À trier", i.category].filter(Boolean).join(", ");
  const give = (rating: "wow" | "worked" | "miss" | null, comment = "") => start(() => markGiven(i.id, rating, comment));

  return (
    <li className={`flex flex-col rounded-2xl ${i.is_lead ? "bg-sun" : "bg-surface"}`}>
      <div className="flex items-start">
        <Link href={`/carnet/idees/${i.id}`} className="flex min-h-[56px] min-w-0 flex-1 flex-col justify-center gap-0.5 py-2.5 pl-3">
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-[16px] font-semibold">{i.title}</span>
            {i.is_lead && <span className="shrink-0 text-[13px] font-semibold text-muted">Piste</span>}
          </span>
          <span className="truncate text-[14px] text-muted">{details}</span>
          {i.note && <span className="line-clamp-2 text-[14px]">{i.note}</span>}
        </Link>
        <button
          type="button"
          onClick={() => setGiving(!giving)}
          aria-expanded={giving}
          aria-label={`${i.title} : offerte`}
          className={`mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${giving ? "bg-ready text-ready-dot" : "text-faint"}`}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3.5 9.5l3.5 3.5 7.5-8" />
          </svg>
        </button>
        <DeleteButton id={i.id} title={i.title} />
      </div>
      {giving && (
        <div className="flex flex-col gap-1 px-1.5 pb-1.5">
          <span className="px-1.5 text-[14px] font-semibold">Offerte, ça a plu ?</span>
          <RatingPicker pending={pending} onRate={(r, c) => give(r, c)} onLater={() => give(null)} />
        </div>
      )}
    </li>
  );
}

export function IdeaList({ ideas, empty = "Aucune idée" }: { ideas: Idea[]; empty?: string }) {
  if (!ideas.length) return <p className="text-muted">{empty}</p>;
  return (
    <ul className="grid gap-2 md:grid-cols-2">
      {ideas.map((i) => (
        <IdeaRow key={i.id} idea={i} />
      ))}
    </ul>
  );
}
