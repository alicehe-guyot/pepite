import { CATEGORIES, recipientChoices } from "@/lib/ideas";
import { IdeaForm } from "../carnet/idees/IdeaForm";

// Saisie rapide (SPEC US-C2) : seul le titre ou le lien est requis.
export default async function CapturePage() {
  const choices = await recipientChoices();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[32px] font-bold">Nouvelle idée</h1>
      <IdeaForm choices={choices} categories={CATEGORIES} />
    </div>
  );
}
