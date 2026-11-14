"use client";

import { useState, useTransition } from "react";

// Titre affiché une seule fois et modifiable sur place (#75) : un tap, on écrit, Entrée ou OK.
export function EditableTitle({ value, onSave, label = "Nom" }: { value: string; onSave: (next: string) => Promise<string | null>; label?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    const next = draft.trim();
    if (!next || next === value) return setEditing(false);
    start(async () => {
      const e = await onSave(next);
      setError(e);
      if (!e) setEditing(false);
    });
  }

  if (!editing) {
    return (
      <button type="button" onClick={() => (setDraft(value), setEditing(true))} aria-label={`Modifier : ${value}`} className="group -mx-1 flex items-start gap-2 rounded-xl px-1 text-left">
        <h1 className="text-[24px] font-bold leading-tight">{value}</h1>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-2 shrink-0 text-faint">
          <path d="M10.5 2.5l3 3L6 13H3v-3z" />
        </svg>
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-1"
    >
      <div className="flex items-center gap-2">
        <input
          autoFocus
          aria-label={label}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
          className="h-12 min-w-0 flex-1 rounded-xl bg-surface px-3 text-[20px] font-bold outline-accent"
        />
        <button type="submit" disabled={pending} className="h-12 rounded-xl bg-accent px-4 text-[16px] font-semibold text-white disabled:opacity-60">
          OK
        </button>
      </div>
      {error && <span className="text-[14px] font-semibold text-accent">{error}</span>}
    </form>
  );
}
