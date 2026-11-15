import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { eventsBetween, getAgenda, getStatusBoard, parisToday, type AgendaEvent } from "@/lib/agenda";
import { Dot, EventRow, Legend, ORDER, STATUS, ViewTabs } from "./ui";
import { StatusSelect } from "./StatusSelect";

const monthTitle = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function EventList({ events, empty }: { events: AgendaEvent[]; empty: string }) {
  if (!events.length) return <p className="text-muted">{empty}</p>;
  return (
    <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {events.map((e) => (
        <EventRow key={`${e.id}-${e.date.toISOString()}`} event={e} />
      ))}
    </ul>
  );
}

// Vue Mois : calendrier, une pastille de couleur par événement sur son jour, puis la liste du mois.
async function MonthView({ month }: { month?: string }) {
  const today = parisToday();
  const [y, m] = /^\d{4}-\d{2}$/.test(month ?? "")
    ? month!.split("-").map(Number)
    : [today.getUTCFullYear(), today.getUTCMonth() + 1];
  const first = new Date(Date.UTC(y, m - 1, 1));
  const last = new Date(Date.UTC(y, m, 0));
  const events = await eventsBetween(first, last);
  const key = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const prev = key(new Date(Date.UTC(y, m - 2, 1)));
  const next = key(new Date(Date.UTC(y, m, 1)));
  const offset = (first.getUTCDay() + 6) % 7; // lundi en premier
  const cells = [...Array(offset).fill(null), ...Array.from({ length: last.getUTCDate() }, (_, i) => i + 1)];

  const arrow = (href: string, label: string, d: string) => (
    <Link href={`/agenda?vue=mois&mois=${href}`} aria-label={label} className="flex h-11 w-11 items-center justify-center rounded-full bg-surface">
      <svg width="10" height="16" viewBox="0 0 10 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d={d} />
      </svg>
    </Link>
  );

  return (
    <>
      <div className="flex items-center justify-between">
        {arrow(prev, "Mois précédent", "M8 2L2 8l6 6")}
        <h2 className="font-display text-xl font-bold first-letter:uppercase">{monthTitle.format(first)}</h2>
        {arrow(next, "Mois suivant", "M2 2l6 6-6 6")}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center md:max-w-2xl">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="text-[12px] font-semibold text-muted">
            {d}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const dayEvents = events.filter((e) => e.date.getUTCDate() === d);
          const isToday = today.getTime() === Date.UTC(y, m - 1, d);
          const main = dayEvents[0];
          return (
            <div
              key={i}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-[15px] ${main ? `${STATUS[main.status].bg} font-bold` : ""} ${isToday ? "ring-2 ring-ink" : ""}`}
              title={dayEvents.map((e) => e.title).join(", ") || undefined}
            >
              {d}
              {dayEvents.length > 0 && (
                <span className="flex gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <Dot key={e.id} status={e.status} />
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <Legend />
      {/* Le détail est dans Prochains (retour Alice #38) : ici, seulement les titres du mois. */}
      {events.length === 0 ? (
        <p className="text-muted">Rien ce mois-ci</p>
      ) : (
        <ul className="flex flex-col">
          {events.map((e) => (
            <li key={`${e.id}-${e.date.toISOString()}`}>
              <Link href={`/agenda/${e.id}`} className="flex min-h-11 items-center gap-3 text-[15px]">
                <span className="w-6 text-right font-semibold tabular-nums">{e.date.getUTCDate()}</span>
                <Dot status={e.status} />
                <span className="truncate">{e.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// Vue Statut : 4 colonnes, événements à moins d'un mois (et ceux du mois passé dans Passé).
async function StatusView() {
  const events = await getStatusBoard();
  return (
    // iPhone : les statuts l'un sous l'autre (plus de défilement horizontal, retour Alice #39).
    // Ordinateur : 4 colonnes côte à côte.
    <div className="flex flex-col gap-5 md:grid md:grid-cols-4 md:gap-3">
      {ORDER.map((k) => {
        const list = events.filter((e) => e.status === k);
        if (k === "past") list.reverse();
        return (
          <section key={k} className="flex flex-col gap-2">
            <h2 className="flex items-center gap-2 text-[15px] font-bold">
              <Dot status={k} />
              {STATUS[k].label}
              <span className="font-semibold text-muted">{list.length}</span>
            </h2>
            {list.length ? (
              <ul className="flex flex-col gap-2">
                {list.map((e) => (
                  <div key={`${e.id}-${e.date.toISOString()}`} className="flex flex-col gap-1">
                    <EventRow event={e} />
                    <StatusSelect eventId={e.id} occurrence={e.date.toISOString().slice(0, 10)} status={e.status} auto={e.auto} />
                  </div>
                ))}
              </ul>
            ) : (
              <p className={`rounded-2xl px-3 py-3 text-[14px] text-muted ${STATUS[k].bg}`}>Aucun</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ vue?: string; mois?: string }> }) {
  const { vue, mois } = await searchParams;
  const view = vue === "mois" || vue === "statut" ? vue : "prochains";

  return (
    <div className="flex flex-col gap-4">
      <PageTitle>Agenda</PageTitle>
      <ViewTabs view={view} />
      {view === "mois" ? (
        <MonthView month={mois} />
      ) : view === "statut" ? (
        <StatusView />
      ) : (
        <EventList events={await getAgenda()} empty="Rien de prévu" />
      )}
    </div>
  );
}
