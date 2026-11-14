"use client";

import { useState, useTransition } from "react";
import type { GivenGift } from "@/lib/gifts";
import { deleteGift, rateGift } from "./actions";
import { RATING_LABEL, RatingPicker } from "./RatingPicker";

const BADGE = { wow: "bg-ready text-ink", worked: "bg-surface text-ink", miss: "bg-todo text-ink" } as const;

function GiftRow({ gift, showRecipients }: { gift: GivenGift; showRecipients: boolean }) {
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  const details = [
    showRecipients && gift.recipients.map((r) => r.name).join(", "),
    [gift.occasion, gift.year].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <li className="flex flex-col rounded-2xl bg-surface">
      <div className="flex items-start">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-h-[56px] min-w-0 flex-1 flex-col justify-center gap-0.5 py-2.5 pl-3 text-left">
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-[16px] font-semibold">{gift.title}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold ${gift.rating ? BADGE[gift.rating] : "bg-sun"}`}>
              {gift.rating ? RATING_LABEL[gift.rating] : "À noter"}
            </span>
          </span>
          {details && <span className="truncate text-[14px] text-muted">{details}</span>}
          {gift.comment && <span className="line-clamp-2 text-[14px]">{gift.comment}</span>}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => (armed ? start(() => deleteGift(gift.id)) : (setArmed(true), setTimeout(() => setArmed(false), 3000)))}
          aria-label={armed ? `Confirmer la suppression de ${gift.title}` : `Supprimer ${gift.title}`}
          className={`m-1.5 flex h-11 shrink-0 items-center justify-center rounded-xl text-[14px] font-semibold ${armed ? "bg-accent px-3 text-white" : "w-11 text-faint"}`}
        >
          {armed ? (
            "Supprimer"
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          )}
        </button>
      </div>
      {open && (
        <div className="px-1.5 pb-1.5">
          <RatingPicker
            initial={gift.rating}
            comment={gift.comment}
            pending={pending}
            onRate={(r, c) => start(async () => {
              await rateGift(gift.id, r, c);
              setOpen(false);
            })}
          />
        </div>
      )}
    </li>
  );
}

// Cadeaux offerts : tap pour noter ou changer la note, croix pour supprimer.
export function GiftList({ gifts, showRecipients = true, empty = "Aucun cadeau offert" }: { gifts: GivenGift[]; showRecipients?: boolean; empty?: string }) {
  if (!gifts.length) return <p className="text-muted">{empty}</p>;
  return (
    <ul className="grid gap-2 md:grid-cols-2">
      {gifts.map((g) => (
        <GiftRow key={g.id} gift={g} showRecipients={showRecipients} />
      ))}
    </ul>
  );
}
