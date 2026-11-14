"use client";

import { useTransition } from "react";
import { setTrait } from "../actions";

const OPTIONS = [
  { field: "gender", value: "female", label: "Femme" },
  { field: "gender", value: "male", label: "Homme" },
  { field: "age_group", value: "adult", label: "Adulte" },
  { field: "age_group", value: "child", label: "Enfant" },
] as const;

// Femme ou homme, adulte ou enfant (#76) : un tap pour choisir, un second pour effacer.
export function TraitChips({ slug, gender, ageGroup }: { slug: string; gender: string | null; ageGroup: string | null }) {
  const [pending, start] = useTransition();
  const current = { gender, age_group: ageGroup };
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((o) => {
        const on = current[o.field] === o.value;
        return (
          <button
            key={o.value}
            type="button"
            disabled={pending}
            aria-pressed={on}
            onClick={() => start(() => setTrait(slug, o.field, on ? null : o.value))}
            className={`flex min-h-11 items-center rounded-full px-3.5 text-[14px] font-semibold ${on ? "bg-accent text-white" : "border border-line text-muted"} ${o.value === "adult" ? "ml-2" : ""}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
