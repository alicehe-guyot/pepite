"use client";

import { useActionState, useState } from "react";
import { saveBirthday, saveBudget, saveCity } from "../actions";

type Props = {
  slug: string;
  months: string[];
  birthday: { label: string | null; day: number | null; month: number | null; year: number | null };
  city: string | null;
  budget: number | null;
};

const chip = "flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-[15px] font-semibold";
const field = "h-11 rounded-xl bg-bg px-3 text-[16px] outline-accent";

function Icon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 opacity-70">
      <path d={d} />
    </svg>
  );
}
const CAKE = "M3 14h10M4 14V9h8v5M8 9V7M8 5.5c-.8-.6-.8-1.6 0-2.5.8.9.8 1.9 0 2.5z";
const PIN = "M8 14s4.5-4 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 10 8 14 8 14zM8 8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z";
const PURSE = "M2.5 5.5h11v8h-11zM5 5.5V4a3 3 0 0 1 6 0v1.5";

// Anniversaire, ville, budget : trois pastilles, un tap pour modifier sur place (#65, plus compact).
export function InfoChips({ slug, months, birthday, city, budget }: Props) {
  const [open, setOpen] = useState<"birthday" | "city" | "budget" | null>(null);
  const done = (r: string | null) => {
    if (r === "Enregistré") setOpen(null);
    return r;
  };
  const [bMsg, bAction, bPending] = useActionState(async (p: string | null, d: FormData) => done(await saveBirthday(slug, p, d)), null);
  const [cMsg, cAction, cPending] = useActionState(async (p: string | null, d: FormData) => done(await saveCity(slug, p, d)), null);
  const [gMsg, gAction, gPending] = useActionState(async (p: string | null, d: FormData) => done(await saveBudget(slug, p, d)), null);
  const toggle = (k: typeof open) => setOpen(open === k ? null : k);
  const tone = (set: boolean, k: typeof open) => (open === k ? "bg-accent text-white" : set ? "bg-surface" : "bg-surface text-faint");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => toggle("birthday")} aria-expanded={open === "birthday"} aria-label="Anniversaire" className={`${chip} ${tone(!!birthday.label, "birthday")}`}>
          <Icon d={CAKE} />
          {birthday.label ?? "Anniversaire"}
        </button>
        <button type="button" onClick={() => toggle("city")} aria-expanded={open === "city"} aria-label="Ville" className={`${chip} ${tone(!!city, "city")}`}>
          <Icon d={PIN} />
          {city || "Ville"}
        </button>
        <button type="button" onClick={() => toggle("budget")} aria-expanded={open === "budget"} aria-label="Budget" className={`${chip} ${tone(!!budget, "budget")}`}>
          <Icon d={PURSE} />
          {budget ? `${budget} €` : "Budget"}
        </button>
      </div>

      {open === "birthday" && (
        <form action={bAction} className="flex flex-wrap items-center gap-2 rounded-2xl bg-sun p-2 md:max-w-md">
          <input name="day" inputMode="numeric" aria-label="Jour" placeholder="Jour" defaultValue={birthday.day ?? ""} className={`${field} w-16`} />
          <select name="month" aria-label="Mois" defaultValue={birthday.month ?? ""} className={`${field} min-w-0 flex-1`}>
            <option value="">Mois</option>
            {months.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <input name="year" inputMode="numeric" aria-label="Année" placeholder="Année" defaultValue={birthday.year ?? ""} className={`${field} w-20`} />
          <button type="submit" disabled={bPending} className="h-11 rounded-xl bg-accent px-4 text-[15px] font-semibold text-white disabled:opacity-60">
            OK
          </button>
          {bMsg && bMsg !== "Enregistré" && <span className="basis-full text-[14px] font-semibold text-accent">{bMsg}</span>}
        </form>
      )}
      {open === "city" && (
        <form action={cAction} className="flex items-center gap-2 rounded-2xl bg-sun p-2 md:max-w-md">
          <input name="city" aria-label="Ville" autoFocus defaultValue={city ?? ""} placeholder="Paris" className={`${field} min-w-0 flex-1`} />
          <button type="submit" disabled={cPending} className="h-11 rounded-xl bg-accent px-4 text-[15px] font-semibold text-white disabled:opacity-60">
            OK
          </button>
          {cMsg && cMsg !== "Enregistré" && <span className="text-[14px] font-semibold text-accent">{cMsg}</span>}
        </form>
      )}
      {open === "budget" && (
        <form action={gAction} className="flex items-center gap-2 rounded-2xl bg-sun p-2 md:max-w-md">
          <input name="budget" inputMode="numeric" aria-label="Budget en euros" autoFocus defaultValue={budget ?? ""} placeholder="100" className={`${field} w-24`} />
          <span className="text-[16px]">€</span>
          <button type="submit" disabled={gPending} className="ml-auto h-11 rounded-xl bg-accent px-4 text-[15px] font-semibold text-white disabled:opacity-60">
            OK
          </button>
          {gMsg && gMsg !== "Enregistré" && <span className="text-[14px] font-semibold text-accent">{gMsg}</span>}
        </form>
      )}
    </div>
  );
}
