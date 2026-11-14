import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { listCategories } from "@/lib/categories";
import { recipientChoices } from "@/lib/ideas";
import { IdeaForm } from "../carnet/idees/IdeaForm";
import { GiftForm } from "../carnet/offerts/GiftForm";

// ＋ : une nouvelle idée (SPEC US-C2, seul le titre ou le lien est requis) ou un cadeau déjà offert (#56).
export default async function CapturePage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const given = type === "offert";
  const [choices, categories] = await Promise.all([recipientChoices(), listCategories()]);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
  const tab = (active: boolean) =>
    `flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-semibold ${active ? "bg-bg text-accent shadow-sm" : "text-muted"}`;

  return (
    <div className="flex flex-col gap-5">
      <PageTitle>{given ? "Déjà offert" : "Nouvelle idée"}</PageTitle>
      <nav aria-label="Que veux-tu ajouter" className="flex gap-1 rounded-2xl bg-surface p-1 md:max-w-sm">
        <Link href="/capture" replace aria-current={!given ? "page" : undefined} className={tab(!given)}>
          Idée
        </Link>
        <Link href="/capture?type=offert" replace aria-current={given ? "page" : undefined} className={tab(given)}>
          Déjà offert
        </Link>
      </nav>
      {given ? <GiftForm choices={choices} categories={categories} today={today} /> : <IdeaForm choices={choices} categories={categories} />}
    </div>
  );
}
