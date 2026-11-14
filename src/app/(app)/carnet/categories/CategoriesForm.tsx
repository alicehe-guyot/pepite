"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { addCategory, deleteCategory } from "./actions";

function Row({ name, count }: { name: string; count: number }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  return (
    <li className="flex min-h-12 items-center gap-2 rounded-2xl bg-surface pl-3">
      <span className="flex-1 text-[16px] font-semibold">{name}</span>
      <span className="text-[14px] text-muted">{count}</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => (armed ? start(() => deleteCategory(name)) : (setArmed(true), setTimeout(() => setArmed(false), 3000)))}
        aria-label={armed ? `Confirmer la suppression de ${name}` : `Supprimer ${name}`}
        className={`m-1 flex h-11 items-center justify-center rounded-xl text-[14px] font-semibold ${armed ? "bg-accent px-3 text-white" : "w-11 text-faint"}`}
      >
        {armed ? (
          "Supprimer"
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        )}
      </button>
    </li>
  );
}

// Liste des catégories : une croix pour supprimer (second tap pour confirmer), un champ pour ajouter.
export function CategoriesForm({ categories }: { categories: { name: string; count: number }[] }) {
  const form = useRef<HTMLFormElement>(null);
  const [message, action, pending] = useActionState(async (p: string | null, d: FormData) => {
    const r = await addCategory(p, d);
    if (!r) form.current?.reset();
    return r;
  }, null);
  return (
    <div className="flex flex-col gap-3 md:max-w-xl">
      <ul className="flex flex-col gap-2">
        {categories.map((c) => (
          <Row key={c.name} name={c.name} count={c.count} />
        ))}
      </ul>
      <form ref={form} action={action} className="flex gap-2">
        <input name="name" required autoComplete="off" placeholder="Nouvelle catégorie" aria-label="Nouvelle catégorie" className="h-12 min-w-0 flex-1 rounded-xl bg-surface px-3 text-[16px] outline-accent placeholder:text-faint" />
        <button type="submit" disabled={pending} className="h-12 rounded-xl bg-accent px-4 text-[16px] font-semibold text-white disabled:opacity-60">
          Ajouter
        </button>
      </form>
      {message && <span className="text-[14px] font-semibold text-accent">{message}</span>}
    </div>
  );
}
