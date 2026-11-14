"use client";

import { useState, useTransition } from "react";
import { RatingPicker } from "../../offerts/RatingPicker";
import { markGiven, unmarkGiven } from "../actions";

// « Offerte » demande la note tout de suite ; « Annuler » rattrape une erreur.
export function GiveIdea({ id, given }: { id: string; given: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const give = (rating: "wow" | "worked" | "miss" | null, comment = "") =>
    start(async () => {
      await markGiven(id, rating, comment);
      setOpen(false);
    });

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-surface p-2 md:max-w-2xl">
      <div className="flex items-center justify-between gap-3 pl-1">
        <span className="text-[16px] font-semibold">{given ? "Déjà offerte" : "Pas encore offerte"}</span>
        <button
          type="button"
          disabled={pending}
          onClick={() => (given ? start(() => unmarkGiven(id)) : setOpen(!open))}
          className="h-11 rounded-xl bg-bg px-4 text-[15px] font-semibold text-accent disabled:opacity-60"
        >
          {given ? "Annuler" : "Offerte"}
        </button>
      </div>
      {open && !given && <RatingPicker pending={pending} onRate={(r, c) => give(r, c)} onLater={() => give(null)} />}
    </div>
  );
}
