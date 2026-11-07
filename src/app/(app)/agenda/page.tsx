import { getAgenda, type AgendaEvent } from "@/lib/agenda";

const day = new Intl.DateTimeFormat("fr-FR", { day: "numeric", timeZone: "UTC" });
const month = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });

function when(daysLeft: number): string {
  if (daysLeft === 0) return "Auj.";
  if (daysLeft === 1) return "Demain";
  return `${daysLeft} j`;
}

// Une ligne compacte par événement, pensée pour l'iPhone (402 pt de large).
function EventRow({ event }: { event: AgendaEvent }) {
  const soon = event.daysLeft <= 30;
  const many = event.persons.length > 1;
  const progress = event.persons.length ? event.found / event.persons.length : 0;

  return (
    <li className={`flex min-h-[64px] items-center gap-3 rounded-2xl px-3 py-2.5 ${soon ? "bg-sun" : "bg-surface"}`}>
      <div className="flex w-10 shrink-0 flex-col items-center leading-none">
        <span className="font-display text-[22px] font-bold">{day.format(event.date)}</span>
        <span className="mt-0.5 text-[11px] font-semibold uppercase text-muted">
          {month.format(event.date).replace(".", "")}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="truncate text-[16px] font-semibold">{event.title}</h2>
          <span className="shrink-0 text-[13px] font-semibold text-muted">{when(event.daysLeft)}</span>
        </div>
        {many && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded bg-white">
              <div className="h-full rounded bg-ink" style={{ width: `${progress * 100}%` }} />
            </div>
            <span className="text-[13px] font-semibold tabular-nums">
              {event.found}/{event.persons.length}
            </span>
          </div>
        )}
        {event.nextAction && <p className="truncate text-[14px] text-muted">{event.nextAction}</p>}
      </div>
    </li>
  );
}

export default async function AgendaPage() {
  const events = await getAgenda();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[28px] font-bold">Agenda</h1>
      {events.length === 0 ? (
        <p className="text-muted">Rien de prévu</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((e) => (
            <EventRow key={`${e.id}-${e.date.toISOString()}`} event={e} />
          ))}
        </ul>
      )}
    </div>
  );
}
