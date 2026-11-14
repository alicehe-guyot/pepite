import Link from "next/link";
import { notFound } from "next/navigation";
import { listCategories } from "@/lib/categories";
import { getIdea, recipientChoices } from "@/lib/ideas";
import { DeleteButton } from "../DeleteButton";
import { IdeaForm } from "../IdeaForm";
import { GiveIdea } from "./GiveIdea";

export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [idea, choices, categories] = await Promise.all([getIdea(id), recipientChoices(), listCategories()]);
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
        <ul className="-mt-3 flex flex-wrap gap-x-4">
          {[idea.url, ...idea.links].map((l) => (
            <li key={l}>
              <a href={l} target="_blank" rel="noreferrer" className="flex min-h-11 items-center text-[15px] font-semibold text-accent">
                {new URL(l).hostname.replace(/^www\./, "")}
              </a>
            </li>
          ))}
        </ul>
      )}

      <GiveIdea id={idea.id} given={idea.given} />

      <IdeaForm choices={choices} categories={categories} idea={idea} />

      <DeleteButton id={idea.id} back="/carnet?vue=idees" wide />
    </div>
  );
}
