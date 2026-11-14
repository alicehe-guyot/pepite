"use client";

import { useActionState, useState } from "react";
import { saveBirthday } from "../actions";

type Value = { day: number | null; month: number | null; year: number | null };

const field = "h-12 rounded-xl bg-surface px-3 text-[16px] outline-accent";

// Anniversaire affiché sur la fiche, modifiable sur place. Jour, mois et année sont facultatifs.
export function BirthdayForm({ slug, label, months, value }: { slug: string; label: string | null; months: string[]; value: Value }) {
  const [editing, setEditing] = useState(false);
  const [message, action, pending] = useActionState(async (prev: string | null, data: FormData) => {
    const result = await saveBirthday(slug, prev, data);
    if (result === "Enregistré") setEditing(false);
    return result;
  }, null);

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="flex min-h-11 w-fit items-center gap-2 text-left text-[16px]">
        <span className="font-semibold">Anniversaire</span>
        <span className={label ? "" : "text-faint"}>{label ?? "à compléter"}</span>
        {message && <span className="text-[14px] text-muted">{message}</span>}
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2 rounded-2xl bg-sun p-3 md:max-w-md">
      <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">Anniversaire</span>
      <div className="flex gap-2">
        <input name="day" inputMode="numeric" aria-label="Jour" placeholder="Jour" defaultValue={value.day ?? ""} className={`${field} w-20 bg-bg`} />
        <select name="month" aria-label="Mois" defaultValue={value.month ?? ""} className={`${field} min-w-0 flex-1 bg-bg`}>
          <option value="">Mois</option>
          {months.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <input name="year" inputMode="numeric" aria-label="Année" placeholder="Année" defaultValue={value.year ?? ""} className={`${field} w-24 bg-bg`} />
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="h-11 flex-1 rounded-xl bg-accent text-[16px] font-semibold text-white disabled:opacity-60">
          Enregistrer
        </button>
        <button type="button" onClick={() => setEditing(false)} className="h-11 px-3 text-[16px] font-semibold text-muted">
          Annuler
        </button>
      </div>
      {message && !pending && <span className="text-[14px] text-muted">{message}</span>}
    </form>
  );
}
