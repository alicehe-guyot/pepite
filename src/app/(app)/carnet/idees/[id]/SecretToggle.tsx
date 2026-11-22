"use client";

import { useOptimistic, useTransition } from "react";
import { Lock } from "@/components/Lock";
import { setIdeaSecret } from "../actions";

// Secret en un tap, en haut de la fiche idée : enregistré tout de suite.
export function SecretToggle({ id, secret }: { id: string; secret: boolean }) {
  const [pending, start] = useTransition();
  const [on, setOn] = useOptimistic(secret);
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOn(!on);
          await setIdeaSecret(id, !on);
        })
      }
      className={`flex h-11 w-fit items-center gap-2 rounded-full px-4 text-[15px] font-semibold ${on ? "bg-accent text-white" : "bg-surface text-muted"}`}
    >
      <Lock size={15} />
      Secret
    </button>
  );
}
