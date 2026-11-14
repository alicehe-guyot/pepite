import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { getEvent, type EventPerson } from "@/lib/agenda";
import { listGroups } from "@/lib/groups";
import { ideasFor, listIdeas } from "@/lib/ideas";
import { listPersons } from "@/lib/persons";
import { STATUS } from "../ui";
import { StatusSelect } from "../StatusSelect";
import { AddPerson } from "./AddPerson";
import { PersonFlow } from "./PersonFlow";

const date = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

// Filtres pour un événement à plusieurs (Noël) : faire les courses d'un coup, voir qui reste.
const FILTERS: { key: string; label: string; keep: (p: EventPerson) => boolean }[] = [
  { key: "", label: "Tous", keep: () => true },
  { key: "a-trouver", label: "À trouver", keep: (p) => p.step === "to_find" },
  { key: "a-acheter", label: "À acheter", keep: (p) => p.step === "chosen" },
  { key: "a-preparer", label: "À préparer", keep: (p) => p.step === "ordered" },
  { key: "prets", label: "Prêts", keep: (p) => p.step === "ready" || p.step === "given" },
];

export default async function EventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ filtre?: string }> }) {
  const { id } = await params;
  const { filtre = "" } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [event, ideas, groups, people] = await Promise.all([getEvent(id), listIdeas(), listGroups(), listPersons()]);
  if (!event) notFound();

  const inEvent = new Set(event.persons.map((p) => p.id));
  const suggestions = [...people.filter((p) => !inEvent.has(p.id)).map((p) => p.name), ...groups.map((g) => g.name)];
  const single = event.persons.length === 1;
  const filter = FILTERS.find((f) => f.key === filtre) ?? FILTERS[0];
  const shown = event.persons.filter(filter.keep);
  const s = STATUS[event.status];

  return (
    <div className="flex flex-col gap-5">
      <BackLink href="/agenda">Agenda</BackLink>
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-bold leading-tight">{event.title}</h1>
        <p className="text-[15px] text-muted first-letter:uppercase">
          {date.format(event.date)}, {event.daysLeft === 0 ? "aujourd'hui" : event.daysLeft < 0 ? `il y a ${-event.daysLeft} j` : `dans ${event.daysLeft} j`}
        </p>
        <p className="flex items-center gap-2 text-[15px] font-semibold">
          <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
          {s.label}
          {!single && (
            <span className="text-muted">
              {event.found}/{event.persons.length} prêts
            </span>
          )}
        </p>
        <StatusSelect eventId={event.id} occurrence={event.date.toISOString().slice(0, 10)} status={event.status} auto={event.auto} />
      </div>

      {!single && event.persons.length > 0 && (
        <ul aria-label="Filtres" className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          {FILTERS.map((f) => (
            <li key={f.key || "tous"} className="shrink-0">
              <Link
                href={f.key ? `/agenda/${event.id}?filtre=${f.key}` : `/agenda/${event.id}`}
                replace
                scroll={false}
                aria-current={f === filter ? "true" : undefined}
                className={`flex h-11 items-center whitespace-nowrap rounded-full px-4 text-[15px] font-semibold ${f === filter ? "bg-ink text-white" : "bg-surface"}`}
              >
                {f.label} <span className="ml-1.5 opacity-70">{event.persons.filter(f.keep).length}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <ul className="grid gap-2 md:grid-cols-2">
        {shown.map((p) => {
          const myGroups = groups.filter((g) => g.members.some((m) => m.id === p.id)).map((g) => g.id);
          const candidates = ideasFor(ideas, p.id, myGroups)
            .filter((i) => !i.given)
            .map((i) => ({ id: i.id, title: i.title, note: i.note }));
          return <PersonFlow key={p.id} eventId={event.id} person={p} candidates={candidates} defaultOpen={single} />;
        })}
      </ul>

      <AddPerson eventId={event.id} suggestions={suggestions} />
    </div>
  );
}
