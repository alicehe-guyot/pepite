"use client";

import { useState, useTransition } from "react";

// Action destructive en deux taps : « Supprimer… » puis « Confirmer » (3 s pour confirmer).
export function ConfirmButton({ action, label }: { action: () => Promise<void>; label: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => (armed ? start(action) : (setArmed(true), setTimeout(() => setArmed(false), 3000)))}
      className={`h-12 w-full rounded-2xl text-[16px] font-semibold md:max-w-2xl ${armed ? "bg-accent text-white" : "text-muted"}`}
    >
      {armed ? "Confirmer" : label}
    </button>
  );
}
