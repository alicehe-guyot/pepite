import Link from "next/link";
import { ageLabel, listPersons } from "@/lib/persons";

const PASTELS = ["bg-[var(--pastel-1)]", "bg-[var(--pastel-2)]", "bg-[var(--pastel-3)]", "bg-[var(--pastel-4)]", "bg-[var(--pastel-5)]"];

export default async function CarnetPage() {
  const persons = await listPersons();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[28px] font-bold">Carnet</h1>
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
    </div>
  );
}
