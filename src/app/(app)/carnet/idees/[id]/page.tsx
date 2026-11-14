import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, getIdea, recipientChoices } from "@/lib/ideas";
import { archiveIdea, markGiven, unmarkGiven } from "../actions";
import { IdeaForm } from "../IdeaForm";

export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [idea, choices] = await Promise.all([getIdea(id), recipientChoices()]);
  if (!idea) notFound();

  return (
    <div className="flex flex-col gap-5">
      <Link href="/carnet?vue=idees" className="-ml-1 flex h-11 w-fit items-center gap-1 text-[16px] font-semibold text-accent">
        <svg width="10" height="16" viewBox="0 0 10 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M8 2L2 8l6 6" />
        </svg>
        Idées
      </Link>

      <h1 className="text-[28px] font-bold leading-tight">{idea.title}</h1>
      {idea.url && (
        <a href={idea.url} target="_blank" rel="noreferrer" className="-mt-3 flex min-h-11 w-fit items-center truncate text-[15px] font-semibold text-accent">
          Ouvrir le lien
        </a>
      )}

      <form action={(idea.given ? unmarkGiven : markGiven).bind(null, idea.id)} className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-3 py-2">
        <span className="text-[16px] font-semibold">{idea.given ? "Déjà offerte" : "Jamais offerte"}</span>
        <button type="submit" className="h-11 rounded-xl bg-bg px-4 text-[15px] font-semibold text-accent">
          {idea.given ? "Annuler" : "Offerte"}
        </button>
      </form>

      <IdeaForm choices={choices} categories={CATEGORIES} idea={idea} />

      <form action={archiveIdea.bind(null, idea.id)}>
        <button type="submit" className="h-12 w-full rounded-2xl text-[16px] font-semibold text-muted">
          Archiver
        </button>
      </form>
    </div>
  );
}
