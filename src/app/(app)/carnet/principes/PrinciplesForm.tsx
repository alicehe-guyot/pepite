"use client";

import { useActionState } from "react";
import { savePrinciples } from "./actions";

export function PrinciplesForm({ value }: { value: string }) {
  const [message, action, pending] = useActionState(savePrinciples, null);
  return (
    <form action={action} className="flex flex-col gap-3 md:max-w-2xl">
      <label htmlFor="principles" className="text-[13px] font-semibold uppercase tracking-wide text-muted">
        Une ligne par principe
      </label>
      <textarea
        id="principles"
        name="principles"
        defaultValue={value}
        rows={8}
        className="field-sizing-content min-h-[200px] resize-none rounded-xl bg-surface px-3 py-2.5 text-[16px] leading-relaxed outline-accent"
      />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="h-11 rounded-xl bg-accent px-5 text-[15px] font-semibold text-white disabled:opacity-60">
          Enregistrer
        </button>
        {message && !pending && <span className="text-[14px] text-muted">{message}</span>}
      </div>
    </form>
  );
}
