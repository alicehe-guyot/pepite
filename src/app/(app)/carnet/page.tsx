import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { AddInline } from "./AddInline";
import { createGroup, createPerson } from "./actions";
import { ageLabel, birthdayLabel, listPersons, traitsOf, TRAITS, type Trait } from "@/lib/persons";
import { listGroups } from "@/lib/groups";
import { listIdeas, recipientChoices } from "@/lib/ideas";
import { listCategories } from "@/lib/categories";
import { IdeasView, type WhoOption } from "./idees/IdeasView";
import { listGivenGifts } from "@/lib/gifts";
import { GiftsView } from "./offerts/GiftsView";

const PASTELS = ["bg-[var(--pastel-1)]", "bg-[var(--pastel-2)]", "bg-[var(--pastel-3)]", "bg-[var(--pastel-4)]", "bg-[var(--pastel-5)]"];

function Tabs({ view }: { view: "personnes" | "idees" | "offerts" }) {
  const tab = (active: boolean) =>
    `flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-semibold ${active ? "bg-bg text-accent shadow-sm" : "text-muted"}`;
  return (
    <nav aria-label="Vues du carnet" className="flex gap-1 rounded-2xl bg-surface p-1 md:max-w-md">
      <Link href="/carnet" aria-current={view === "personnes" ? "page" : undefined} className={tab(view === "personnes")}>
        Personnes
      </Link>
      <Link href="/carnet?vue=idees" aria-current={view === "idees" ? "page" : undefined} className={tab(view === "idees")}>
        Idées
      </Link>
      <Link href="/carnet?vue=offerts" aria-current={view === "offerts" ? "page" : undefined} className={tab(view === "offerts")}>
        Offerts
      </Link>
    </nav>
  );
}

const chevron = (
  <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--faint)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M1 1l6 6-6 6" />
  </svg>
);

// Titre de section repliable : chevron qui tourne, compte à droite.
function Summary({ title, count }: { title: string; count: number }) {
  return (
    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="transition-transform group-open/s:rotate-90">
        <path d="M4 2l4 4-4 4" />
      </svg>
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <span className="text-[14px] text-muted">{count}</span>
    </summary>
  );
}

// Filtre des personnes (#76) : Femme, Homme, Adulte, Enfant ; un tap pour activer, un second pour retirer.
function PersonFilter({ active }: { active: Trait[] }) {
  const href = (t: Trait) => {
    const next = active.includes(t) ? active.filter((x) => x !== t) : [...active.filter((x) => (t === "female" || t === "male" ? x !== "female" && x !== "male" : x !== "adult" && x !== "child")), t];
    return next.length ? `/carnet?t=${next.join(",")}` : "/carnet";
  };
  return (
    <ul className="flex flex-wrap gap-2">
      {(Object.keys(TRAITS) as Trait[]).map((t) => (
        <li key={t}>
          <Link href={href(t)} replace scroll={false} aria-current={active.includes(t) ? "true" : undefined} className={`flex min-h-11 items-center rounded-full px-3.5 text-[14px] font-semibold ${active.includes(t) ? "bg-accent text-white" : "bg-surface"}`}>
            {TRAITS[t]}
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function Persons({ active }: { active: Trait[] }) {
  const [everyone, groups, ideas] = await Promise.all([listPersons(), listGroups(), listIdeas()]);
  // Idées en cours par personne (#91) : directes et via ses groupes, pas encore offertes.
  const open = ideas.filter((i) => !i.given);
  const ideaCount = (id: string) => {
    const mine = groups.filter((g) => g.members.some((m) => m.id === id)).map((g) => g.id);
    return open.filter((i) => i.recipients.some((r) => (r.kind === "person" ? r.id === id : mine.includes(r.id)))).length;
  };
  const persons = everyone.filter((p) => active.every((t) => p.gender === t || p.age_group === t));
  const pastel = new Map(everyone.map((p, i) => [p.id, PASTELS[i % PASTELS.length]]));
  return (
    <>
      <PersonFilter active={active} />
      <details open className="group/s flex flex-col">
        <Summary title="Personnes" count={persons.length} />
        <AddInline action={createPerson} placeholder="Prénom" />
        <ul className="grid md:grid-cols-2 md:gap-x-8 lg:grid-cols-3 2xl:grid-cols-4">
          {persons.map((p) => {
            const n = ideaCount(p.id);
            const details = [n ? `${n} ${n > 1 ? "idées" : "idée"}` : null, ageLabel(p), birthdayLabel(p), p.city].filter(Boolean).join(", ");
            return (
              <li key={p.id}>
                <Link href={`/carnet/${p.slug}`} className="flex min-h-[56px] items-center gap-3 py-1.5">
                  <span
                    aria-hidden="true"
                    className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-[15px] font-bold ${pastel.get(p.id)}`}
                  >
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      p.name.charAt(0)
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[16px] font-semibold">{p.name}</span>
                    {details && <span className="truncate text-[14px] text-muted">{details}</span>}
                  </span>
                  {chevron}
                </Link>
              </li>
            );
          })}
        </ul>
      </details>
      <details open className="group/s flex flex-col">
        <Summary title="Groupes" count={groups.length} />
        <AddInline action={createGroup} placeholder="Nom du groupe" />
        <ul className="grid md:grid-cols-2 md:gap-x-8 lg:grid-cols-3 2xl:grid-cols-4">
          {groups.map((g) => (
            <li key={g.id}>
              <Link href={`/carnet/groupe/${g.slug}`} className="flex min-h-[56px] items-center gap-3 py-1.5">
                <span aria-hidden="true" className="flex w-10 shrink-0 -space-x-3">
                  {g.members.slice(0, 3).map((m) => (
                    <span key={m.id} className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ring-2 ring-bg ${pastel.get(m.id)}`}>
                      {m.name.charAt(0)}
                    </span>
                  ))}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[16px] font-semibold">{g.name}</span>
                  <span className="truncate text-[14px] text-muted">{g.members.length} personnes</span>
                </span>
                {chevron}
              </Link>
            </li>
          ))}
        </ul>
      </details>

    </>
  );
}

type Filters = { qui?: string; statut?: string; cat?: string; note?: string; genre?: string; age?: string; tri?: string };

// « Pour qui » : personnes (Moi d'abord) puis groupes, avec ce qu'ils couvrent.
async function whoOptions(): Promise<WhoOption[]> {
  const [choices, groups] = await Promise.all([recipientChoices(), listGroups()]);
  return [
    ...choices
      .filter((c) => c.kind === "person")
      .map((p) => ({
        key: p.slug,
        label: p.name,
        kind: "person" as const,
        personIds: [p.id],
        groupIds: groups.filter((g) => g.members.some((m) => m.id === p.id)).map((g) => g.id),
      })),
    ...groups.map((g) => ({ key: g.slug, label: g.name, kind: "group" as const, personIds: g.members.map((m) => m.id), groupIds: [g.id] })),
  ];
}

const initialOf = (f: Filters, keys: (keyof Filters)[]) => Object.fromEntries(keys.map((k) => [k, f[k] ?? ""]));

async function Ideas({ filters }: { filters: Filters }) {
  const [all, who, categories, persons, groups] = await Promise.all([listIdeas(), whoOptions(), listCategories(), listPersons(), listGroups()]);
  const ideas = all.filter((i) => !i.given); // les idées offertes vivent dans Offerts
  const traits = Object.fromEntries(ideas.map((i) => [i.id, traitsOf(i.recipients, persons, groups)]));
  return <IdeasView ideas={ideas} categories={categories} who={who} traits={traits} initial={initialOf(filters, ["qui", "genre", "age", "statut", "cat", "tri"])} />;
}

async function Gifts({ filters }: { filters: Filters }) {
  const [gifts, who, categories, persons, groups] = await Promise.all([listGivenGifts(), whoOptions(), listCategories(), listPersons(), listGroups()]);
  const traits = Object.fromEntries(gifts.map((g) => [g.id, traitsOf(g.recipients, persons, groups)]));
  return <GiftsView gifts={gifts} categories={categories} who={who} traits={traits} initial={initialOf(filters, ["qui", "genre", "age", "note", "cat"])} />;
}

export default async function CarnetPage({ searchParams }: { searchParams: Promise<{ vue?: string; t?: string } & Filters> }) {
  const { vue, t, ...filters } = await searchParams;
  const active = (t ?? "").split(",").filter((x): x is Trait => x in TRAITS);
  const view = vue === "idees" || vue === "offerts" ? vue : "personnes";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <PageTitle>Carnet</PageTitle>
        <Link href="/carnet/principes" aria-label="Réglages" title="Réglages" className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-muted">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </Link>
      </div>
      <Tabs view={view} />
      {view === "idees" ? <Ideas filters={filters} /> : view === "offerts" ? <Gifts filters={filters} /> : <Persons active={active} />}
    </div>
  );
}
