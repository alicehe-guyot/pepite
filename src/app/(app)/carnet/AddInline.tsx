"use client";

import { useActionState, useState } from "react";

// « Ajouter » à côté d'un titre de section : un champ, puis la page de la nouvelle fiche (#77).
export function AddInline({ action, placeholder }: { action: (prev: string | null, data: FormData) => Promise<string | null>; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [message, formAction, pending] = useActionState(action, null);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex h-11 items-center gap-1 rounded-xl px-2 text-[15px] font-semibold text-accent">
        <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M7 2v10M2 7h10" />
        </svg>
        Ajouter
      </button>
    );
  }
  return (
    <form action={formAction} className="flex basis-full gap-2 md:max-w-md">
      <input name="name" required autoFocus autoComplete="off" placeholder={placeholder} aria-label={placeholder} className="h-11 min-w-0 flex-1 rounded-xl bg-surface px-3 text-[16px] outline-accent placeholder:text-faint" />
      <button type="submit" disabled={pending} className="h-11 rounded-xl bg-accent px-4 text-[15px] font-semibold text-white disabled:opacity-60">
        Créer
      </button>
      {message && <span className="self-center text-[14px] font-semibold text-accent">{message}</span>}
    </form>
  );
}
