"use client";

import { useActionState } from "react";
import { addGivenGift } from "./actions";
import { RATING_LABEL } from "./RatingPicker";

type Choice = { kind: "person" | "group"; id: string; name: string };

const chip =
  "flex min-h-11 cursor-pointer items-center rounded-full bg-surface px-4 text-[15px] font-semibold has-checked:bg-accent has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-accent";
const field = "rounded-xl bg-surface px-3 py-2.5 text-[16px] outline-accent placeholder:text-faint";
const label = "text-[13px] font-semibold uppercase tracking-wide text-muted";

// Cadeau déjà offert : quoi, pour qui, quand, occasion, puis la note (facultative : sinon « À noter »).
export function GiftForm({
  choices,
  categories,
  today,
  preset = [],
  back,
}: {
  choices: Choice[];
  categories: string[];
  today: string;
  preset?: string[];
  back?: string;
}) {
  const [message, action, pending] = useActionState(addGivenGift, null);
  const people = choices.filter((c) => c.kind === "person");
  const groups = choices.filter((c) => c.kind === "group");

  return (
    <form action={action} className="flex flex-col gap-5 md:max-w-2xl">
      {back && <input type="hidden" name="back" value={back} />}
      <label className="flex flex-col gap-1">
        <span className={label}>Quoi</span>
        <input name="title" required autoFocus autoComplete="off" className={`h-12 ${field}`} />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${label} mb-2`}>Pour qui</legend>
        <div className="flex flex-wrap gap-2">
          {people.map((c) => (
            <label key={c.id} className={chip}>
              <input type="checkbox" name="for" value={`person:${c.id}`} defaultChecked={preset.includes(`person:${c.id}`)} className="sr-only" />
              {c.name}
            </label>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {groups.map((c) => (
            <label key={c.id} className={chip}>
              <input type="checkbox" name="for" value={`group:${c.id}`} defaultChecked={preset.includes(`group:${c.id}`)} className="sr-only" />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className={label}>Quand</span>
          <input name="given_on" type="date" defaultValue={today} className={`h-12 ${field}`} />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className={label}>Occasion</span>
          <input name="occasion" autoComplete="off" placeholder="Noël 2025" className={`h-12 ${field}`} />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${label} mb-2`}>Catégories</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <label key={c} className={chip}>
              <input type="checkbox" name="categories" value={c} className="sr-only" />
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className={label}>Commentaire</span>
        <textarea name="comment" rows={2} className={`field-sizing-content min-h-[48px] resize-none ${field}`} />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${label} mb-2`}>Ça a plu ?</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(RATING_LABEL) as (keyof typeof RATING_LABEL)[]).map((r) => (
            <label key={r} className={chip}>
              <input type="radio" name="rating" value={r} className="sr-only" />
              {RATING_LABEL[r]}
            </label>
          ))}
          <label className={chip}>
            <input type="radio" name="rating" value="" defaultChecked className="sr-only" />
            À noter
          </label>
        </div>
      </fieldset>

      <div className="sticky bottom-24 flex items-center gap-3 bg-bg pt-1 md:bottom-4">
        <button type="submit" disabled={pending} className="h-12 flex-1 rounded-2xl bg-accent text-[17px] font-semibold text-white disabled:opacity-60">
          Ajouter
        </button>
        {message && !pending && <span className="text-[14px] font-semibold text-accent">{message}</span>}
      </div>
    </form>
  );
}
