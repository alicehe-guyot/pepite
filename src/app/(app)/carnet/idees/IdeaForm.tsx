"use client";

import { useActionState } from "react";
import { saveIdea } from "./actions";

type Choice = { kind: "person" | "group"; id: string; name: string };
type Initial = {
  id: string;
  title: string;
  url: string | null;
  note: string | null;
  category: string | null;
  is_lead: boolean;
  recipients: { kind: "person" | "group"; id: string }[];
};

const chip =
  "flex min-h-11 cursor-pointer items-center rounded-full bg-surface px-4 text-[15px] font-semibold has-checked:bg-accent has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-accent";
const field = "rounded-xl bg-surface px-3 py-2.5 text-[16px] outline-accent placeholder:text-faint";
const label = "text-[13px] font-semibold uppercase tracking-wide text-muted";

function Chip({ type, name, value, checked, children }: { type: "checkbox" | "radio"; name: string; value: string; checked: boolean; children: React.ReactNode }) {
  return (
    <label className={chip}>
      <input type={type} name={name} value={value} defaultChecked={checked} className="sr-only" />
      {children}
    </label>
  );
}

export function IdeaForm({ choices, categories, idea }: { choices: Choice[]; categories: readonly string[]; idea?: Initial }) {
  const [message, action, pending] = useActionState(saveIdea.bind(null, idea?.id ?? null), null);
  const chosen = new Set(idea?.recipients.map((r) => `${r.kind}:${r.id}`));
  const people = choices.filter((c) => c.kind === "person");
  const groups = choices.filter((c) => c.kind === "group");

  return (
    <form action={action} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1">
        <span className={label}>{idea ? "Titre" : "Titre ou lien"}</span>
        <input
          name="title"
          required
          autoFocus={!idea}
          defaultValue={idea?.title}
          autoComplete="off"
          placeholder={idea ? undefined : "Coller un lien ou écrire"}
          className={`h-12 ${field}`}
        />
      </label>

      {idea && (
        <label className="flex flex-col gap-1">
          <span className={label}>Lien</span>
          <input name="url" type="url" inputMode="url" defaultValue={idea.url ?? ""} autoComplete="off" className={`h-12 ${field}`} />
        </label>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className={`${label} mb-2`}>Pour qui</legend>
        <div className="flex flex-wrap gap-2">
          {people.map((c) => (
            <Chip key={c.id} type="checkbox" name="for" value={`person:${c.id}`} checked={chosen.has(`person:${c.id}`)}>
              {c.name}
            </Chip>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {groups.map((c) => (
            <Chip key={c.id} type="checkbox" name="for" value={`group:${c.id}`} checked={chosen.has(`group:${c.id}`)}>
              {c.name}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${label} mb-2`}>Catégorie</legend>
        <div className="flex flex-wrap gap-2">
          <Chip type="radio" name="category" value="" checked={!idea?.category}>
            Aucune
          </Chip>
          {categories.map((c) => (
            <Chip key={c} type="radio" name="category" value={c} checked={idea?.category === c}>
              {c}
            </Chip>
          ))}
          {idea?.category && !categories.includes(idea.category) && (
            <Chip type="radio" name="category" value={idea.category} checked>
              {idea.category}
            </Chip>
          )}
        </div>
      </fieldset>

      <label className="flex min-h-11 items-center justify-between gap-3">
        <span className="text-[16px] font-semibold">Piste</span>
        <input type="checkbox" name="is_lead" defaultChecked={idea?.is_lead} className="h-6 w-6 accent-[var(--accent)]" />
      </label>

      <label className="flex flex-col gap-1">
        <span className={label}>Commentaire</span>
        <textarea
          name="note"
          rows={2}
          defaultValue={idea?.note ?? ""}
          className={`field-sizing-content min-h-[48px] resize-none ${field}`}
        />
      </label>

      <div className="sticky bottom-24 flex items-center gap-3 bg-bg pt-1">
        <button
          type="submit"
          disabled={pending}
          className="h-12 flex-1 rounded-2xl bg-accent text-[17px] font-semibold text-white disabled:opacity-60"
        >
          {idea ? "Enregistrer" : "Ajouter"}
        </button>
        {message && !pending && <span className="text-[14px] text-muted">{message}</span>}
      </div>
    </form>
  );
}
