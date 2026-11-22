"use client";

import { useActionState, useState } from "react";
import { Lock } from "@/components/Lock";
import { saveIdea } from "./actions";

type Choice = { kind: "person" | "group"; id: string; name: string };
type Initial = {
  id: string;
  title: string;
  url: string | null;
  links: string[];
  note: string | null;
  categories: string[];
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

export function IdeaForm({
  choices,
  categories,
  idea,
  preset = [],
  back,
  shared,
}: {
  choices: Choice[];
  categories: readonly string[];
  idea?: Initial;
  preset?: string[]; // destinataires cochés d'office, ex. depuis une fiche (#90)
  back?: string; // page où revenir après l'ajout
  shared?: { title: string; note: string }; // reçu du raccourci iOS
}) {
  const [message, action, pending] = useActionState(saveIdea.bind(null, idea?.id ?? null), null);
  const chosen = new Set(idea ? idea.recipients.map((r) => `${r.kind}:${r.id}`) : preset);
  const people = choices.filter((c) => c.kind === "person");
  const groups = choices.filter((c) => c.kind === "group");
  // Au moins 3 champs de lien, plus à la demande (retour Alice #8).
  const saved = idea?.url ? [idea.url, ...idea.links] : [];
  // Un champ à la capture, trois sur une idée existante ; « Ajouter un lien » pour plus.
  const pad = (list: string[], n: number) => [...list, ...Array(Math.max(0, n - list.length)).fill("")];
  const [links, setLinks] = useState<string[]>(pad(saved, idea ? 3 : 1));

  return (
    <form action={action} className="flex flex-col gap-5 md:max-w-2xl">
      {back && <input type="hidden" name="back" value={back} />}
      {!idea && (
        <label className="flex flex-col gap-1">
          <span className={label}>Titre ou lien</span>
          <input
            name="title"
            required
            autoFocus={!shared}
            defaultValue={shared?.title}
            autoComplete="off"
            placeholder="Coller un lien ou écrire"
            className={`h-12 ${field}`}
          />
        </label>
      )}
      {!idea && (
        <label className={`${chip} w-fit gap-2`}>
          <input type="checkbox" name="secret" value="1" className="sr-only" />
          <Lock size={15} />
          Secret
        </label>
      )}


      <label className="flex flex-col gap-1">
        <span className={label}>Commentaire</span>
        <textarea
          name="note"
          rows={2}
          defaultValue={idea?.note ?? shared?.note ?? ""}
          className={`field-sizing-content min-h-[48px] resize-none ${field}`}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${label} mb-2`}>Liens</legend>
        {links.map((l, i) => (
          <input
            key={i}
            name="link"
            type="url"
            inputMode="url"
            autoComplete="off"
            aria-label={`Lien ${i + 1}`}
            placeholder="https://"
            value={l}
            onChange={(e) => setLinks(links.map((x, j) => (j === i ? e.target.value : x)))}
            className={`h-12 ${field}`}
          />
        ))}
        <button type="button" onClick={() => setLinks([...links, ""])} className="flex h-11 w-fit items-center text-[15px] font-semibold text-accent">
          Ajouter un lien
        </button>
      </fieldset>

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
        <legend className={`${label} mb-2`}>Catégories</legend>
        <div className="flex flex-wrap gap-2">
          {[...new Set([...categories, ...(idea?.categories ?? [])])].map((c) => (
            <Chip key={c} type="checkbox" name="categories" value={c} checked={idea?.categories.includes(c) ?? false}>
              {c}
            </Chip>
          ))}
        </div>
      </fieldset>


      <div className="sticky bottom-24 md:bottom-4 flex items-center gap-3 bg-bg pt-1">
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
