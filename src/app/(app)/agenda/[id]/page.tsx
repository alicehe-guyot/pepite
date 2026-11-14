import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { getEvent, type PersonStatus } from "@/lib/agenda";
import { listGroups } from "@/lib/groups";
import { ideasFor, listIdeas } from "@/lib/ideas";
import { cycleStatus, removePerson } from "../actions";
import { listPersons } from "@/lib/persons";
import { AddPerson } from "./AddPerson";

const LABEL: Record<PersonStatus, string> = { to_find: "À trouver", lead: "Piste", found: "Trouvé", given: "Offert" };
const GIFT: Record<string, string> = { chosen: "Choisi", to_plan: "À planifier", ordered: "Commandé", ready: "Prêt", given: "Offert" };
const date = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

// Rond vide, à moitié plein, plein ; coche pour offert (SPEC §8.10).
function StatusDot({ status }: { status: PersonStatus }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="13" cy="13" r="11" fill={status === "found" || status === "given" ? "var(--ink)" : "none"} stroke="var(--ink)" strokeWidth="2" />
      {status === "lead" && <path d="M13 2a11 11 0 0 1 0 22z" fill="var(--ink)" />}
      {status === "given" && <path d="M8 13.5l3.5 3.5L18 10" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [event, ideas, groups, people] = await Promise.all([getEvent(id), listIdeas(), listGroups(), listPersons()]);
  if (!event) notFound();
  const inEvent = new Set(event.persons.map((p) => p.id));
  const suggestions = [...people.filter((p) => !inEvent.has(p.id)).map((p) => p.name), ...groups.map((g) => g.name)];
  const done = event.persons.filter((p) => p.status === "found" || p.status === "given").length;

  return (
    <div className="flex flex-col gap-5">
      <BackLink href="/agenda">Agenda</BackLink>
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-bold leading-tight">{event.title}</h1>
        <p className="text-[15px] text-muted first-letter:uppercase">
          {date.format(event.date)}, {event.daysLeft === 0 ? "aujourd'hui" : event.daysLeft < 0 ? `il y a ${-event.daysLeft} j` : `dans ${event.daysLeft} j`}
        </p>
        {event.persons.length > 1 && (
          <p className="text-[15px] font-semibold">
            {done}/{event.persons.length} trouvés
          </p>
        )}
      </div>

      <ul className="grid gap-2 md:grid-cols-2">
        {event.persons.map((p) => {
          const myGroups = groups.filter((g) => g.members.some((m) => m.id === p.id)).map((g) => g.id);
          const stock = ideasFor(ideas, p.id, myGroups).filter((i) => !i.given).length;
          const gifts = event.gifts.filter((g) => g.personIds.includes(p.id) || g.groupIds.some((gid) => myGroups.includes(gid)));
          return (
            <li key={p.id} className={`flex items-center gap-1 rounded-2xl ${p.status === "lead" ? "bg-sun" : "bg-surface"}`}>
              <form action={cycleStatus.bind(null, event.id, p.id, p.status)}>
                <button type="submit" aria-label={`${p.name} : ${LABEL[p.status]}, passer à l'étape suivante`} className="flex h-14 w-14 items-center justify-center">
                  <StatusDot status={p.status} />
                </button>
              </form>
              <Link href={`/carnet/${p.slug}`} className="flex min-h-14 min-w-0 flex-1 flex-col justify-center py-2">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[16px] font-semibold">{p.name}</span>
                  <span className="shrink-0 text-[13px] font-semibold text-muted">{LABEL[p.status]}</span>
                </span>
                {gifts.map((g) => (
                  <span key={g.id} className="truncate text-[14px]">
                    {g.title}, {GIFT[g.status].toLowerCase()}
                  </span>
                ))}
                {!gifts.length && (
                  <span className="text-[14px] text-muted">
                    {stock ? `${stock} ${stock > 1 ? "idées" : "idée"} en stock` : "Aucune idée"}
                  </span>
                )}
              </Link>
              <form action={removePerson.bind(null, event.id, p.id)}>
                <button type="submit" aria-label={`Retirer ${p.name}`} className="flex h-14 w-11 items-center justify-center text-faint">
                  <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M2 2l10 10M12 2L2 12" />
                  </svg>
                </button>
              </form>
            </li>
          );
        })}
      </ul>

      <AddPerson eventId={event.id} suggestions={suggestions} />
    </div>
  );
}
