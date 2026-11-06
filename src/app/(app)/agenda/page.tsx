import { getAgenda, type AgendaEvent, type PersonStatus } from "@/lib/agenda";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function when(daysLeft: number): string {
  if (daysLeft === 0) return "Aujourd’hui";
  if (daysLeft === 1) return "Demain";
  return `Dans ${daysLeft} j`;
}

// Rond vide : à trouver ; à moitié plein : piste ; plein : trouvé ; framboise : offert.
function StatusDot({ status }: { status: PersonStatus }) {
  const label = { to_find: "À trouver", lead: "Piste", found: "Trouvé", given: "Offert" }[status];
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" role="img" aria-label={label} className="shrink-0">
      <circle cx="7" cy="7" r="6" fill="none" stroke={status === "given" ? "var(--accent)" : "var(--ink)"} strokeWidth="1.5" />
      {status === "lead" && <path d="M7 1a6 6 0 0 1 0 12z" fill="var(--ink)" />}
      {status === "found" && <circle cx="7" cy="7" r="6" fill="var(--ink)" />}
      {status === "given" && <circle cx="7" cy="7" r="6" fill="var(--accent)" />}
    </svg>
  );
}

function EventCard({ event }: { event: AgendaEvent }) {
  const soon = event.daysLeft <= 30;
  const many = event.persons.length > 1;
  const progress = event.persons.length ? event.found / event.persons.length : 0;

  return (
    <article className={`flex flex-col gap-3 rounded-[20px] p-5 ${soon ? "bg-sun" : "bg-surface"}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-bold">{event.title}</h2>
        <span className="shrink-0 text-sm font-semibold text-muted">{when(event.daysLeft)}</span>
      </div>
      <p className="-mt-2 text-sm text-muted first-letter:uppercase">{dateFormat.format(event.date)}</p>

      {many && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded bg-white">
              <div className="h-full rounded bg-ink" style={{ width: `${progress * 100}%` }} />
            </div>
            <span className="text-sm font-semibold">
              {event.found}/{event.persons.length} trouvés
            </span>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {event.persons.map((p) => (
              <li key={p.id} className="flex items-center gap-1.5 text-[15px]">
                <StatusDot status={p.status} />
                {p.name}
              </li>
            ))}
          </ul>
        </>
      )}

      {event.nextAction && <p className="text-[17px] font-semibold">{event.nextAction}</p>}
    </article>
  );
}

export default async function AgendaPage() {
  const events = await getAgenda();

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-[32px] font-bold">Agenda</h1>
      {events.length === 0 ? (
        <p className="text-muted">Rien de prévu</p>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((e) => (
            <EventCard key={`${e.id}-${e.date.toISOString()}`} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
