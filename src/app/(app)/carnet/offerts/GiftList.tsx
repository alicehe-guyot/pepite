"use client";

import { useState, useTransition } from "react";
import type { GivenGift } from "@/lib/gifts";
import { deleteGift, rateGift, setGiftCategories, setGiftDate } from "./actions";
import { RATING_LABEL, RatingPicker } from "./RatingPicker";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const BADGE = { wow: "bg-ready text-ink", worked: "bg-surface text-ink", miss: "bg-todo text-ink" } as const;

function GiftRow({ gift, showRecipients, categories }: { gift: GivenGift; showRecipients: boolean; categories: string[] }) {
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  const details = [
    showRecipients && gift.recipients.map((r) => r.name).join(", "),
    gift.givenOn ? dateFormat.format(new Date(`${gift.givenOn}T00:00:00Z`)) : [gift.occasion, gift.year].filter(Boolean).join(" "),
    gift.givenOn && gift.occasion,
    ...gift.categories,
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
        <div className="flex flex-col gap-1.5 px-1.5 pb-1.5">
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-bg px-3 py-1.5 text-[15px] font-semibold">
            Offert le
            <input
              type="date"
              defaultValue={gift.givenOn ?? ""}
              onChange={(e) => start(() => setGiftDate(gift.id, e.target.value))}
              className="h-11 rounded-xl bg-surface px-2 text-[16px] outline-accent"
            />
          </label>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 rounded-2xl bg-bg p-2">
              {categories.map((c) => {
                const on = gift.categories.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    disabled={pending}
                    onClick={() => start(() => setGiftCategories(gift.id, on ? gift.categories.filter((x) => x !== c) : [...gift.categories, c]))}
                    className={`flex min-h-11 items-center rounded-full px-3 text-[14px] font-semibold ${on ? "bg-accent text-white" : "bg-surface"}`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          )}
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
export function GiftList({
  gifts,
  showRecipients = true,
  empty = "Aucun cadeau offert",
  categories = [],
}: {
  gifts: GivenGift[];
  showRecipients?: boolean;
  empty?: string;
  categories?: string[];
}) {
  if (!gifts.length) return <p className="text-muted">{empty}</p>;
  return (
    <ul className="grid gap-2 md:grid-cols-2">
      {gifts.map((g) => (
        <GiftRow key={g.id} gift={g} showRecipients={showRecipients} categories={categories} />
      ))}
    </ul>
  );
}
