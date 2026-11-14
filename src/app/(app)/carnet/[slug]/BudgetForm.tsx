"use client";

import { useActionState, useState } from "react";
import { saveBudget } from "../actions";

// Budget habituel, affiché sur la fiche et modifiable sur place.
export function BudgetForm({ slug, value }: { slug: string; value: number | null }) {
  const [editing, setEditing] = useState(false);
  const [message, action, pending] = useActionState(async (prev: string | null, data: FormData) => {
    const result = await saveBudget(slug, prev, data);
    if (result === "Enregistré") setEditing(false);
    return result;
  }, null);

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="flex min-h-11 w-fit items-center gap-2 text-left text-[16px]">
        <span className="font-semibold">Budget</span>
        <span className={value ? "" : "text-faint"}>{value ? `jusqu'à ${value} €` : "à compléter"}</span>
        {message && <span className="text-[14px] text-muted">{message}</span>}
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2 rounded-2xl bg-sun p-3 md:max-w-md">
      <label htmlFor="budget" className="text-[16px] font-semibold">
        Budget
      </label>
      <input
        id="budget"
        name="budget"
        inputMode="numeric"
        autoFocus
        defaultValue={value ?? ""}
        placeholder="100"
        className="h-11 w-24 rounded-xl bg-bg px-3 text-[16px] outline-accent"
      />
      <span className="text-[16px]">€</span>
      <button type="submit" disabled={pending} className="ml-auto h-11 rounded-xl bg-accent px-4 text-[16px] font-semibold text-white disabled:opacity-60">
        Enregistrer
      </button>
    </form>
  );
}
