import Link from "next/link";
import { notFound } from "next/navigation";
import { ageLabel, birthdayLabel, getPerson, MONTHS, RUBRICS } from "@/lib/persons";
import { BirthdayForm } from "./BirthdayForm";
import { BudgetForm } from "./BudgetForm";
import { ideasFor, listIdeas, shareText } from "@/lib/ideas";
import { ShareButton } from "@/components/ShareButton";
import { IdeaList } from "../idees/IdeaList";
import { giftsFor, listGivenGifts } from "@/lib/gifts";
import { GiftList } from "../offerts/GiftList";
import { PortraitForm } from "./PortraitForm";
import { buildBrief, myPrinciples, nextEventFor } from "@/lib/brief";

export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [person, allIdeas, allGifts, principles] = await Promise.all([getPerson(slug), listIdeas(), listGivenGifts(), myPrinciples()]);
  if (!person) notFound();
  const event = await nextEventFor(person.id);
  const groupIds = person.groups.map((g) => g.id);
  const ideas = ideasFor(allIdeas, person.id, groupIds).filter((i) => !i.given);
  const given = giftsFor(allGifts, person.id, groupIds);
  const brief = buildBrief(person, { ideas, gifts: given, principles, event });

  const details = [ageLabel(person), person.city].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-5">
      <Link href="/carnet" className="-ml-1 flex h-11 w-fit items-center gap-1 text-[16px] font-semibold text-accent">
        <svg width="10" height="16" viewBox="0 0 10 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M8 2L2 8l6 6" />
        </svg>
        Carnet
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-bold leading-tight">{person.name}</h1>
        {details && <p className="text-[15px] text-muted">{details}</p>}
        <p className="text-[15px] text-muted">
          {ideas.length} {ideas.length > 1 ? "idées" : "idée"}
        </p>
      </div>

      {person.groups.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {person.groups.map((g) => (
            <li key={g.id}>
              <Link href={`/carnet/groupe/${g.slug}`} className="flex min-h-11 items-center rounded-full bg-surface px-4 text-[14px] font-semibold">
                {g.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <BirthdayForm
        slug={person.slug}
        label={birthdayLabel(person)}
        months={MONTHS}
        value={{ day: person.birth_day, month: person.birth_month, year: person.birth_year }}
      />
      <BudgetForm slug={person.slug} value={person.budget_max} />

      <div className="flex flex-wrap gap-2">
        <ShareButton text={brief} label="Copier le brief" copy />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">Idées</h2>
        {ideas.some((i) => !i.given) && (
          <ShareButton text={shareText(`Idées cadeaux pour ${person.name}`, [{ name: person.name, ideas }])} />
        )}
        <IdeaList ideas={ideas} empty="Pas encore d'idée" />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">Déjà offert</h2>
        <GiftList gifts={given} empty="Rien d'offert pour l'instant" />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">Portrait</h2>
        <PortraitForm
          slug={person.slug}
          rubrics={[
            ...RUBRICS.map((r) => ({ key: r.key, label: r.label, value: person[r.key] })),
            { key: "description", label: "Notes", value: person.description },
          ]}
        />
      </section>

    </div>
  );
}
