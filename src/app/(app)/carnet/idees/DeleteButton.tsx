"use client";

import { useEffect, useState, useTransition } from "react";
import { deleteIdea } from "./actions";

// Croix de suppression : un premier tap demande confirmation, le second supprime.
export function DeleteButton({ id, title, back, wide }: { id: string; title?: string; back?: string; wide?: boolean }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  function onClick() {
    if (!armed) return setArmed(true);
    start(() => deleteIdea(id, back));
  }

  if (wide) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={`h-12 w-full rounded-2xl md:max-w-2xl text-[16px] font-semibold ${armed ? "bg-accent text-white" : "text-muted"}`}
      >
        {armed ? "Confirmer" : "Supprimer"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={armed ? `Confirmer la suppression de ${title}` : `Supprimer ${title}`}
      className={`m-1.5 flex h-11 shrink-0 items-center justify-center rounded-xl text-[14px] font-semibold disabled:opacity-50 ${armed ? "bg-accent px-3 text-white" : "w-11 text-faint"}`}
    >
      {armed ? (
        "Supprimer"
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M2 2l10 10M12 2L2 12" />
        </svg>
      )}
    </button>
  );
}
