import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { ShareButton } from "@/components/ShareButton";
import { buildBrief, myPrinciples, upcomingEventsFor } from "@/lib/brief";
import { giftsFor, listGivenGifts } from "@/lib/gifts";
import { ideasFor, listIdeas, shareText } from "@/lib/ideas";
import { ageLabel, birthdayLabel, getPerson, MONTHS } from "@/lib/persons";
import { IdeaList } from "../idees/IdeaList";
import { GiftList } from "../offerts/GiftList";
import { BriefButton } from "./BriefButton";
import { InfoChips } from "./InfoChips";
import { TraitChips } from "./TraitChips";
import { PhotoPicker } from "@/components/PhotoPicker";
import { NotesForm } from "./NotesForm";
import { EditableTitle } from "@/components/EditableTitle";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deletePerson, renamePerson } from "../actions";

function Section({ title, count, action, children }: { title: string; count?: number; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">
          {title}
          {count !== undefined && <span className="ml-1.5 text-[14px] font-semibold text-muted">{count}</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// Fiche personne compacte (#65) : infos en pastilles, idées, offerts, notes, brief.
export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [person, allIdeas, allGifts, principles] = await Promise.all([getPerson(slug), listIdeas(), listGivenGifts(), myPrinciples()]);
  if (!person) notFound();
  const events = await upcomingEventsFor(person.id);
  const groupIds = person.groups.map((g) => g.id);
  const ideas = ideasFor(allIdeas, person.id, groupIds).filter((i) => !i.given);
  const given = giftsFor(allGifts, person.id, groupIds);
  const briefs = [
    ...events.map((e) => ({ key: `${e.id}-${e.date.toISOString()}`, label: e.title, text: buildBrief(person, { ideas, gifts: given, principles, event: e }) })),
    { key: "aucun", label: "Sans occasion", text: buildBrief(person, { ideas, gifts: given, principles, event: null }) },
  ];
  const age = ageLabel(person);

  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/carnet">Carnet</BackLink>

      <div className="flex items-center gap-3">
        <PhotoPicker kind="persons" id={person.id} url={person.photoUrl ?? null} fallback={person.name.charAt(0)} />
        <div className="flex min-w-0 flex-col">
          <EditableTitle value={person.name} onSave={renamePerson.bind(null, person.slug)} />
          {age && <span className="text-[15px] text-muted">{age}</span>}
        </div>
      </div>

      <InfoChips
        slug={person.slug}
        months={MONTHS}
        birthday={{ label: birthdayLabel(person), day: person.birth_day, month: person.birth_month, year: person.birth_year }}
        city={person.city}
        budget={person.budget_max}
        sizes={person.sizes}
      />

      <TraitChips slug={person.slug} gender={person.gender} ageGroup={person.age_group} />

      {person.groups.length > 0 && (
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
          {person.groups.map((g) => (
            <li key={g.id} className="shrink-0">
              <Link href={`/carnet/groupe/${g.slug}`} className="flex min-h-11 items-center whitespace-nowrap rounded-full border border-line px-3.5 text-[14px] font-semibold">
                {g.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <BriefButton briefs={briefs} />

      <Section
        title="Idées"
        count={ideas.length}
        action={ideas.length > 0 && <ShareButton text={shareText(`Idées cadeaux pour ${person.name}`, [{ name: person.name, ideas, sizes: person.sizes }])} label="Partager" small photos={ideas.flatMap((i) => (i.imageUrl ? [{ url: i.imageUrl, name: i.title }] : []))} />}
      >
        <IdeaList ideas={ideas} empty="Pas encore d'idée" />
      </Section>

      <Section title="Déjà offert" count={given.length}>
        <GiftList gifts={given} empty="Rien d'offert pour l'instant" />
      </Section>

      <Section title="Notes">
        <NotesForm slug={person.slug} value={person.description} />
      </Section>

      <ConfirmButton action={deletePerson.bind(null, person.slug)} label="Supprimer la fiche" />
    </div>
  );
}
