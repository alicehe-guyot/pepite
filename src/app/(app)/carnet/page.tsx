import Link from "next/link";
import { ageLabel, listPersons } from "@/lib/persons";
import { CATEGORIES, listIdeas } from "@/lib/ideas";
import { IdeasView } from "./idees/IdeasView";

const PASTELS = ["bg-[var(--pastel-1)]", "bg-[var(--pastel-2)]", "bg-[var(--pastel-3)]", "bg-[var(--pastel-4)]", "bg-[var(--pastel-5)]"];

function Tabs({ view }: { view: "personnes" | "idees" }) {
  const tab = (active: boolean) =>
    `flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-semibold ${active ? "bg-bg shadow-sm" : "text-muted"}`;
  return (
    <nav aria-label="Vues du carnet" className="flex gap-1 rounded-2xl bg-surface p-1">
      <Link href="/carnet" aria-current={view === "personnes" ? "page" : undefined} className={tab(view === "personnes")}>
        Personnes
      </Link>
      <Link href="/carnet?vue=idees" aria-current={view === "idees" ? "page" : undefined} className={tab(view === "idees")}>
        Idées
      </Link>
    </nav>
  );
}

async function Persons() {
  const persons = await listPersons();
  return (
    <ul className="flex flex-col">
      {persons.map((p, i) => {
        const details = [ageLabel(p), p.city].filter(Boolean).join(", ");
        return (
          <li key={p.id}>
            <Link href={`/carnet/${p.slug}`} className="flex min-h-[56px] items-center gap-3 py-1.5">
              <span
                aria-hidden="true"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold ${PASTELS[i % PASTELS.length]}`}
              >
                {p.name.charAt(0)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[16px] font-semibold">{p.name}</span>
                {details && <span className="truncate text-[14px] text-muted">{details}</span>}
              </span>
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--faint)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M1 1l6 6-6 6" />
              </svg>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

async function Ideas({ filter }: { filter: string }) {
  const ideas = await listIdeas();
  return <IdeasView ideas={ideas} categories={CATEGORIES} initial={filter} />;
}

export default async function CarnetPage({ searchParams }: { searchParams: Promise<{ vue?: string; filtre?: string }> }) {
  const { vue, filtre } = await searchParams;
  const view = vue === "idees" ? "idees" : "personnes";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[28px] font-bold">Carnet</h1>
      <Tabs view={view} />
      {view === "idees" ? <Ideas filter={filtre ?? ""} /> : <Persons />}
    </div>
  );
}
