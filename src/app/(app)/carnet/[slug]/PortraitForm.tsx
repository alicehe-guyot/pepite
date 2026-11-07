"use client";

import { useActionState } from "react";
import { savePortrait } from "../actions";

type Rubric = { key: string; label: string; value: string | null };

export function PortraitForm({ slug, rubrics }: { slug: string; rubrics: Rubric[] }) {
  const [message, action, pending] = useActionState(savePortrait.bind(null, slug), null);

  return (
    <form action={action} className="flex flex-col gap-3">
      {rubrics.map((r) => (
        <label key={r.key} className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">{r.label}</span>
          <textarea
            name={r.key}
            defaultValue={r.value ?? ""}
            placeholder="à compléter"
            rows={2}
            className="field-sizing-content min-h-[48px] resize-none rounded-xl bg-surface px-3 py-2.5 text-[16px] outline-accent placeholder:text-faint"
          />
        </label>
      ))}
      <div className="sticky bottom-24 flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="h-12 flex-1 rounded-2xl bg-accent text-[17px] font-semibold text-white disabled:opacity-60"
        >
          Enregistrer
        </button>
        {message && !pending && <span className="text-[14px] text-muted">{message}</span>}
      </div>
    </form>
  );
}
