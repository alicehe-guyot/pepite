import Link from "next/link";
import { ageLabel, listPersons } from "@/lib/persons";
import { CATEGORIES, listIdeas, type Idea } from "@/lib/ideas";
import { IdeaList } from "./idees/IdeaList";

const PASTELS = ["bg-[var(--pastel-1)]", "bg-[var(--pastel-2)]", "bg-[var(--pastel-3)]", "bg-[var(--pastel-4)]", "bg-[var(--pastel-5)]"];

// Filtres des idées (SPEC §8.10) : catégories, plus Pistes et Sans personne.
const FILTERS: { key: string; label: string; keep: (i: Idea) => boolean }[] = [
  { key: "", label: "Toutes", keep: () => true },
  { key: "pistes", label: "Pistes", keep: (i) => i.is_lead },
  { key: "a-trier", label: "Sans personne", keep: (i) => i.recipients.length === 0 },
  ...CATEGORIES.map((c) => ({ key: c, label: c, keep: (i: Idea) => i.category === c })),
];

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
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const shown = ideas.filter(active.keep);
  return (
    <>
      <ul aria-label="Filtres" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {FILTERS.map((f) => {
          const on = f.key === active.key;
          const href = f.key ? `/carnet?vue=idees&filtre=${encodeURIComponent(f.key)}` : "/carnet?vue=idees";
          return (
            <li key={f.key || "toutes"} className="shrink-0">
              <Link
                href={href}
                aria-current={on ? "true" : undefined}
                className={`flex h-11 items-center whitespace-nowrap rounded-full px-4 text-[15px] font-semibold ${on ? "bg-ink text-white" : "bg-surface"}`}
              >
                {f.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <IdeaList ideas={shown} />
    </>
  );
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
