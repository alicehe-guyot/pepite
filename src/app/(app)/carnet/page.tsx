import Link from "next/link";
import { ageLabel, birthdayLabel, listPersons } from "@/lib/persons";
import { listGroups } from "@/lib/groups";
import { listIdeas, recipientChoices } from "@/lib/ideas";
import { listCategories } from "@/lib/categories";
import { IdeasView, type WhoOption } from "./idees/IdeasView";
import { listGivenGifts } from "@/lib/gifts";
import { GiftsView } from "./offerts/GiftsView";

const PASTELS = ["bg-[var(--pastel-1)]", "bg-[var(--pastel-2)]", "bg-[var(--pastel-3)]", "bg-[var(--pastel-4)]", "bg-[var(--pastel-5)]"];

function Tabs({ view }: { view: "personnes" | "idees" | "offerts" }) {
  const tab = (active: boolean) =>
    `flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-semibold ${active ? "bg-bg shadow-sm" : "text-muted"}`;
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

async function Persons() {
  const [persons, groups] = await Promise.all([listPersons(), listGroups()]);
  const pastel = new Map(persons.map((p, i) => [p.id, PASTELS[i % PASTELS.length]]));
  return (
    <>
      <details open className="group/s flex flex-col">
        <Summary title="Personnes" count={persons.length} />
        <ul className="grid md:grid-cols-2 md:gap-x-8 lg:grid-cols-3">
          {persons.map((p) => {
            const details = [ageLabel(p), birthdayLabel(p), p.city].filter(Boolean).join(", ");
            return (
              <li key={p.id}>
                <Link href={`/carnet/${p.slug}`} className="flex min-h-[56px] items-center gap-3 py-1.5">
                  <span
                    aria-hidden="true"
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold ${pastel.get(p.id)}`}
                  >
                    {p.name.charAt(0)}
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
        <ul className="grid md:grid-cols-2 md:gap-x-8 lg:grid-cols-3">
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

type Filters = { qui?: string; statut?: string; cat?: string; note?: string };

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

async function Ideas({ filters }: { filters: Filters }) {
  const [all, who, categories] = await Promise.all([listIdeas(), whoOptions(), listCategories()]);
  const ideas = all.filter((i) => !i.given); // les idées offertes vivent dans Offerts
  return <IdeasView ideas={ideas} categories={categories} who={who} initial={{ qui: filters.qui ?? "", statut: filters.statut ?? "", cat: filters.cat ?? "" }} />;
}

async function Gifts({ filters }: { filters: Filters }) {
  const [gifts, who, categories] = await Promise.all([listGivenGifts(), whoOptions(), listCategories()]);
  return <GiftsView gifts={gifts} categories={categories} who={who} initial={{ qui: filters.qui ?? "", note: filters.note ?? "", cat: filters.cat ?? "" }} />;
}

export default async function CarnetPage({ searchParams }: { searchParams: Promise<{ vue?: string } & Filters> }) {
  const { vue, ...filters } = await searchParams;
  const view = vue === "idees" || vue === "offerts" ? vue : "personnes";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[28px] font-bold">Carnet</h1>
        <Link href="/carnet/principes" className="flex min-h-11 items-center rounded-full bg-surface px-4 text-[15px] font-semibold">
          Mes principes
        </Link>
      </div>
      <Tabs view={view} />
      {view === "idees" ? <Ideas filters={filters} /> : view === "offerts" ? <Gifts filters={filters} /> : <Persons />}
    </div>
  );
}
