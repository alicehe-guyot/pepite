"use client";

import { useActionState } from "react";
import { renameGroup } from "../../actions";

export function RenameForm({ slug, name }: { slug: string; name: string }) {
  const [message, action, pending] = useActionState(renameGroup.bind(null, slug), null);
  return (
    <form action={action} className="flex flex-col gap-1">
      <label htmlFor="group-name" className="text-[13px] font-semibold uppercase tracking-wide text-muted">
        Nom du groupe
      </label>
      <div className="flex gap-2">
        <input
          id="group-name"
          name="name"
          required
          defaultValue={name}
          autoComplete="off"
          className="h-12 min-w-0 flex-1 rounded-xl bg-surface px-3 text-[16px] outline-accent"
        />
        <button type="submit" disabled={pending} className="h-12 rounded-xl bg-accent px-4 text-[16px] font-semibold text-white disabled:opacity-60">
          Renommer
        </button>
      </div>
      {message && !pending && <span className="text-[14px] text-muted">{message}</span>}
    </form>
  );
}
