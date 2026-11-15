import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { listCategories } from "@/lib/categories";
import { recipientChoices } from "@/lib/ideas";
import { IdeaForm } from "../carnet/idees/IdeaForm";
import { GiftForm } from "../carnet/offerts/GiftForm";

// ＋ : une nouvelle idée (SPEC US-C2, seul le titre ou le lien est requis) ou un cadeau déjà offert (#56).
// `pour` (person:<id> ou group:<id>) coche d'office le destinataire ; `retour` : page où revenir (#90).
export default async function CapturePage({ searchParams }: { searchParams: Promise<{ type?: string; pour?: string; retour?: string }> }) {
  const { type, pour, retour } = await searchParams;
  const preset = pour && /^(person|group):[0-9a-f-]{36}$/.test(pour) ? [pour] : [];
  const back = retour?.startsWith("/carnet/") ? retour : undefined;
  const keep = new URLSearchParams({ ...(pour && { pour }), ...(back && { retour: back }) }).toString();
  const given = type === "offert";
  const [choices, categories] = await Promise.all([recipientChoices(), listCategories()]);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
  const tab = (active: boolean) =>
    `flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-semibold ${active ? "bg-bg text-accent shadow-sm" : "text-muted"}`;

  return (
    <div className="flex flex-col gap-5">
      <PageTitle>{given ? "Déjà offert" : "Nouvelle idée"}</PageTitle>
      <nav aria-label="Que veux-tu ajouter" className="flex gap-1 rounded-2xl bg-surface p-1 md:max-w-sm">
        <Link href={`/capture${keep ? `?${keep}` : ""}`} replace aria-current={!given ? "page" : undefined} className={tab(!given)}>
          Idée
        </Link>
        <Link href={`/capture?type=offert${keep ? `&${keep}` : ""}`} replace aria-current={given ? "page" : undefined} className={tab(given)}>
          Déjà offert
        </Link>
      </nav>
      {given ? <GiftForm choices={choices} categories={categories} today={today} preset={preset} back={back} /> : <IdeaForm choices={choices} categories={categories} preset={preset} back={back} />}
    </div>
  );
}
