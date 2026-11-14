"use client";

import { useActionState, useState } from "react";
import { saveNotes } from "../actions";

// Notes : tout le portrait en texte libre (#64). Le bouton n'apparaît qu'après une modification.
export function NotesForm({ slug, value }: { slug: string; value: string | null }) {
  const [dirty, setDirty] = useState(false);
  const [message, action, pending] = useActionState(async (p: string | null, d: FormData) => {
    const r = await saveNotes(slug, p, d);
    if (r === "Enregistré") setDirty(false);
    return r;
  }, null);
  return (
    <form action={action} className="flex flex-col gap-2 md:max-w-2xl">
      <textarea
        name="description"
        aria-label="Notes"
        defaultValue={value ?? ""}
        placeholder="Ce qu'elle aime, sa situation, ce qu'il faut éviter…"
        onChange={() => setDirty(true)}
        className="field-sizing-content min-h-[96px] resize-none rounded-xl bg-surface px-3 py-2.5 text-[15px] leading-relaxed outline-accent placeholder:text-faint"
      />
      {(dirty || message) && (
        <div className="flex items-center gap-3">
          {dirty && (
            <button type="submit" disabled={pending} className="h-11 rounded-xl bg-accent px-5 text-[15px] font-semibold text-white disabled:opacity-60">
              Enregistrer
            </button>
          )}
          {message && !pending && <span className="text-[14px] text-muted">{message}</span>}
        </div>
      )}
    </form>
  );
}
