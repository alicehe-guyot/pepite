"use client";

import { useActionState, useRef } from "react";
import { addToEvent } from "../actions";

// Ajouter une personne ou un groupe ; un nom inconnu crée la fiche.
export function AddPerson({ eventId, suggestions }: { eventId: string; suggestions: string[] }) {
  const form = useRef<HTMLFormElement>(null);
  const [message, action, pending] = useActionState(async (prev: string | null, data: FormData) => {
    const result = await addToEvent(eventId, prev, data);
    form.current?.reset();
    return result;
  }, null);

  return (
    <form ref={form} action={action} className="flex flex-col gap-1 md:max-w-md">
      <label htmlFor="add-person" className="text-[13px] font-semibold uppercase tracking-wide text-muted">
        Ajouter
      </label>
      <div className="flex gap-2">
        <input
          id="add-person"
          name="name"
          list="people"
          required
          autoComplete="off"
          placeholder="Personne ou groupe"
          className="h-12 min-w-0 flex-1 rounded-xl bg-surface px-3 text-[16px] outline-accent placeholder:text-faint"
        />
        <datalist id="people">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <button type="submit" disabled={pending} className="h-12 rounded-xl bg-accent px-4 text-[16px] font-semibold text-white disabled:opacity-60">
          Ajouter
        </button>
      </div>
      {message && !pending && <span className="text-[14px] text-muted">{message}</span>}
    </form>
  );
}
