import Link from "next/link";
import { notFound } from "next/navigation";
import { ageLabel, getPerson, RUBRICS } from "@/lib/persons";
import { PortraitForm } from "./PortraitForm";

export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const person = await getPerson(slug);
  if (!person) notFound();

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
          {person.ideas} {person.ideas > 1 ? "idées" : "idée"}
        </p>
      </div>

      {person.groups.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {person.groups.map((g) => (
            <li key={g} className="rounded-full bg-surface px-3 py-1.5 text-[14px] font-semibold">
              {g}
            </li>
          ))}
        </ul>
      )}

      {person.description && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-xl font-bold">Notes</h2>
          <p className="whitespace-pre-line rounded-xl bg-sun px-3 py-2.5 text-[15px]">{person.description}</p>
        </section>
      )}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">Portrait</h2>
        <PortraitForm
          slug={person.slug}
          rubrics={RUBRICS.map((r) => ({ key: r.key, label: r.label, value: person[r.key] }))}
        />
      </section>

    </div>
  );
}
