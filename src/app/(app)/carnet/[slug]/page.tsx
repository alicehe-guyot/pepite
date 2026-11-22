import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { ShareButton } from "@/components/ShareButton";
import { STEP_LABEL } from "@/lib/agenda";
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
import { Lock } from "@/components/Lock";
import { NotesForm } from "./NotesForm";
import { EditableTitle } from "@/components/EditableTitle";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deletePerson, renamePerson } from "../actions";

function AddLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex h-11 items-center gap-1 rounded-xl px-2 text-[15px] font-semibold text-accent">
      <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M7 2v10M2 7h10" />
      </svg>
      {label}
    </Link>
  );
}

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
  // Ce qui est choisi pour les prochains événements, pas encore offert.
  const chosen = events.flatMap((e) => (e.gift && e.step !== "given" ? [{ event: e, gift: e.gift, step: e.step }] : []));

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

      {chosen.length > 0 && (
        <Section title="Choisi" count={chosen.length}>
          <ul className="grid gap-2 md:grid-cols-2">
            {chosen.map(({ event, gift, step }) => (
              <li key={`${event.id}-${gift.id}`}>
                <Link href={`/agenda/${event.id}`} className={`flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2 ${step === "ready" ? "bg-ready" : "bg-progress"}`}>
                  <span aria-hidden="true" className={`h-3 w-3 shrink-0 rounded-full ${step === "ready" ? "bg-ready-dot" : "bg-progress-dot"}`} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[16px] font-semibold">
                        {gift.secret && (
                          <span role="img" aria-label="Secret" className="mr-1.5 inline-block align-[-1px] text-accent">
                            <Lock />
                          </span>
                        )}
                        {gift.title}
                      </span>
                      <span className="shrink-0 text-[13px] font-semibold">{STEP_LABEL[step]}</span>
                    </span>
                    <span className="truncate text-[14px] text-muted">{event.title}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section
        title="Idées"
        count={ideas.length}
        action={
          <span className="flex items-center">
            <AddLink href={`/capture?pour=person:${person.id}&retour=/carnet/${person.slug}`} label="Idée" />
            {ideas.length > 0 && <ShareButton text={shareText(`Idées cadeaux pour ${person.name}`, [{ name: person.name, ideas, sizes: person.sizes }])} label="Partager" small photos={ideas.flatMap((i) => (i.imageUrl ? [{ url: i.imageUrl, name: i.title }] : []))} />}
          </span>
        }
      >
        <IdeaList ideas={ideas} empty="Pas encore d'idée" />
      </Section>

      <Section title="Déjà offert" count={given.length} action={<AddLink href={`/capture?type=offert&pour=person:${person.id}&retour=/carnet/${person.slug}`} label="Offert" />}>
        <GiftList gifts={given} empty="Rien d'offert pour l'instant" />
      </Section>

      <Section title="Notes">
        <NotesForm slug={person.slug} value={person.description} />
      </Section>

      <ConfirmButton action={deletePerson.bind(null, person.slug)} label="Supprimer la fiche" />
    </div>
  );
}
