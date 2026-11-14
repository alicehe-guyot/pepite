import Link from "next/link";
import type { AgendaEvent, EventStatus } from "@/lib/agenda";

// Couleur + libellé : jamais la couleur seule.
export const STATUS: Record<EventStatus, { label: string; bg: string; dot: string }> = {
  todo: { label: "Pas commencé", bg: "bg-todo", dot: "bg-todo-dot" },
  progress: { label: "En cours", bg: "bg-progress", dot: "bg-progress-dot" },
  ready: { label: "Prêt", bg: "bg-ready", dot: "bg-ready-dot" },
  past: { label: "Passé", bg: "bg-past", dot: "bg-past-dot" },
};
export const ORDER: EventStatus[] = ["todo", "progress", "ready", "past"];

const day = new Intl.DateTimeFormat("fr-FR", { day: "numeric", timeZone: "UTC" });
const month = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });

function when(daysLeft: number): string {
  if (daysLeft === 0) return "Auj.";
  if (daysLeft === 1) return "Demain";
  if (daysLeft < 0) return `il y a ${-daysLeft} j`;
  return `${daysLeft} j`;
}

export function Dot({ status }: { status: EventStatus }) {
  return <span aria-hidden="true" className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${STATUS[status].dot}`} />;
}

// Une ligne par événement, fond selon le statut.
export function EventRow({ event }: { event: AgendaEvent }) {
  const many = event.persons.length > 1;
  const progress = event.persons.length ? event.found / event.persons.length : 0;
  const s = STATUS[event.status];

  return (
    <li>
      <Link href={`/agenda/${event.id}`} className={`flex min-h-[64px] items-center gap-3 rounded-2xl px-3 py-2.5 ${s.bg}`}>
        <div className="flex w-10 shrink-0 flex-col items-center leading-none">
          <span className="font-display text-[22px] font-bold">{day.format(event.date)}</span>
          <span className="mt-0.5 text-[11px] font-semibold uppercase text-muted">{month.format(event.date).replace(".", "")}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="truncate text-[16px] font-semibold">{event.title}</h2>
            <span className="shrink-0 text-[13px] font-semibold text-muted">{when(event.daysLeft)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Dot status={event.status} />
            <span className="text-[13px] font-semibold">{s.label}</span>
            {many && (
              <>
                <div className="h-1.5 flex-1 overflow-hidden rounded bg-white">
                  <div className={`h-full rounded ${s.dot}`} style={{ width: `${progress * 100}%` }} />
                </div>
                <span className="text-[13px] font-semibold tabular-nums">
                  {event.found}/{event.persons.length}
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}

export function ViewTabs({ view }: { view: "prochains" | "mois" | "statut" }) {
  const tab = (active: boolean) =>
    `flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-semibold ${active ? "bg-bg shadow-sm" : "text-muted"}`;
  const views = [
    { key: "prochains", label: "Prochains", href: "/agenda" },
    { key: "mois", label: "Mois", href: "/agenda?vue=mois" },
    { key: "statut", label: "Statut", href: "/agenda?vue=statut" },
  ] as const;
  return (
    <nav aria-label="Vues de l'agenda" className="flex gap-1 rounded-2xl bg-surface p-1 md:max-w-md">
      {views.map((v) => (
        <Link key={v.key} href={v.href} aria-current={view === v.key ? "page" : undefined} className={tab(view === v.key)}>
          {v.label}
        </Link>
      ))}
    </nav>
  );
}

export function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
      {ORDER.map((k) => (
        <li key={k} className="flex items-center gap-1.5">
          <Dot status={k} />
          {STATUS[k].label}
        </li>
      ))}
    </ul>
  );
}
