import { BackLink } from "@/components/BackLink";
import { EditableTitle } from "@/components/EditableTitle";
import { renameIdea } from "../actions";
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
      <BackLink href="/carnet?vue=idees">Idées</BackLink>

      <EditableTitle value={idea.title} onSave={renameIdea.bind(null, idea.id)} label="Titre" />
      {idea.url && (
        <ul className="-mt-2 flex flex-wrap gap-x-4">
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
