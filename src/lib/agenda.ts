import "server-only";
import { createClient } from "@/lib/supabase/server";

// Agenda (SPEC §8.3 et §8.10) : événements et avancement par personne.
// 3 vues (retour Alice #22) : Prochains, Mois, Statut. Un statut par occurrence, avec sa couleur.
// La « prochaine action » sous chaque événement a été retirée (#24 : peu fiable).
// Le secret est appliqué par la RLS : les cadeaux qu'on n'a pas le droit de voir ne remontent pas ici.

export const HORIZON_DAYS = 90;
export const STATUS_WINDOW_DAYS = 30; // un événement entre dans la vue Statut à moins d'un mois

export type PersonStatus = "to_find" | "lead" | "found" | "given";
export type EventStatus = "todo" | "progress" | "ready" | "past";

export type AgendaEvent = {
  id: string;
  title: string;
  date: Date; // occurrence affichée
  daysLeft: number; // négatif si passé
  persons: { id: string; name: string; status: PersonStatus }[];
  found: number;
  status: EventStatus;
};

type EventRow = {
  id: string;
  title: string;
  date: string;
  recurrence: "yearly" | "none";
  event_persons: { status: PersonStatus; persons: { id: string; name: string } | null }[];
};

type GiftRow = {
  title: string;
  status: "chosen" | "to_plan" | "ordered" | "ready" | "given";
};

const DAY = 86_400_000;

// Minuit, heure de Paris, exprimé comme une date UTC (pour compter les jours sans décalage).
export function parisToday(now = new Date()): Date {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" })
    .format(now)
    .split("-")
    .map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// Prochaine occurrence (aujourd'hui compris) d'un événement annuel ; date telle quelle sinon.
export function nextOccurrence(date: string, recurrence: "yearly" | "none", today: Date): Date {
  const [y, m, d] = date.split("-").map(Number);
  if (recurrence !== "yearly") return new Date(Date.UTC(y, m - 1, d));
  let next = new Date(Date.UTC(today.getUTCFullYear(), m - 1, d));
  if (next < today) next = new Date(Date.UTC(today.getUTCFullYear() + 1, m - 1, d));
  return next;
}

// Occurrences entre deux dates incluses (une par an pour un événement annuel).
function occurrencesBetween(date: string, recurrence: "yearly" | "none", from: Date, to: Date): Date[] {
  const [y, m, d] = date.split("-").map(Number);
  const years = recurrence === "yearly" ? [from.getUTCFullYear(), to.getUTCFullYear()] : [y];
  return [...new Set(years)].map((yy) => new Date(Date.UTC(yy, m - 1, d))).filter((o) => o >= from && o <= to);
}

// Prêt : tout le monde a son cadeau. En cours : au moins une piste ou un cadeau trouvé. Passé : date dépassée.
export function eventStatus(persons: { status: PersonStatus }[], daysLeft: number): EventStatus {
  if (daysLeft < 0) return "past";
  const done = persons.filter((p) => p.status === "found" || p.status === "given").length;
  if (persons.length && done === persons.length) return "ready";
  if (persons.some((p) => p.status !== "to_find")) return "progress";
  return "todo";
}

async function loadEvents(): Promise<EventRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, date, recurrence, event_persons(status, persons(id, name))")
    .returns<EventRow[]>();
  if (error) throw error;
  return data ?? [];
}

function toAgendaEvent(e: EventRow, date: Date, today: Date): AgendaEvent {
  const daysLeft = Math.round((date.getTime() - today.getTime()) / DAY);
  const persons = e.event_persons
    .filter((ep) => ep.persons)
    .map((ep) => ({ id: ep.persons!.id, name: ep.persons!.name, status: ep.status }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return {
    id: e.id,
    title: e.title,
    date,
    daysLeft,
    persons,
    found: persons.filter((p) => p.status === "found" || p.status === "given").length,
    status: eventStatus(persons, daysLeft),
  };
}

// Toutes les occurrences entre deux dates, triées.
export async function eventsBetween(from: Date, to: Date): Promise<AgendaEvent[]> {
  const today = parisToday();
  const events = await loadEvents();
  return events
    .flatMap((e) => occurrencesBetween(e.date, e.recurrence, from, to).map((d) => toAgendaEvent(e, d, today)))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Vue Prochains : les 90 prochains jours.
export async function getAgenda(): Promise<AgendaEvent[]> {
  const today = parisToday();
  return eventsBetween(today, new Date(today.getTime() + HORIZON_DAYS * DAY));
}

// Vue Statut : du mois passé au mois à venir.
export async function getStatusBoard(): Promise<AgendaEvent[]> {
  const today = parisToday();
  return eventsBetween(new Date(today.getTime() - STATUS_WINDOW_DAYS * DAY), new Date(today.getTime() + STATUS_WINDOW_DAYS * DAY));
}

export type EventDetail = {
  id: string;
  title: string;
  date: Date;
  daysLeft: number;
  persons: { id: string; slug: string; name: string; status: PersonStatus }[];
  gifts: { id: string; title: string; status: GiftRow["status"]; personIds: string[]; groupIds: string[] }[];
};

// Vue d'un événement : chaque personne avec son avancement, et les cadeaux prévus.
export async function getEvent(id: string): Promise<EventDetail | null> {
  const supabase = await createClient();
  const [{ data: e, error }, { data: gifts, error: giftsError }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, date, recurrence, event_persons(status, persons(id, slug, name))")
      .eq("id", id)
      .maybeSingle<
        Omit<EventRow, "event_persons"> & {
          event_persons: { status: PersonStatus; persons: { id: string; slug: string; name: string } | null }[];
        }
      >(),
    supabase
      .from("gifts")
      .select("id, title, status, gift_recipients(person_id, group_id)")
      .eq("event_id", id)
      .returns<
        { id: string; title: string; status: GiftRow["status"]; gift_recipients: { person_id: string | null; group_id: string | null }[] }[]
      >(),
  ]);
  if (error) throw error;
  if (giftsError) throw giftsError;
  if (!e) return null;
  const today = parisToday();
  const date = nextOccurrence(e.date, e.recurrence, today);
  return {
    id: e.id,
    title: e.title,
    date,
    daysLeft: Math.round((date.getTime() - today.getTime()) / 86_400_000),
    persons: e.event_persons
      .flatMap((ep) => (ep.persons ? [{ ...ep.persons, status: ep.status }] : []))
      .sort((a, b) => a.name.localeCompare(b.name, "fr")),
    gifts: (gifts ?? []).map(({ gift_recipients, ...g }) => ({
      ...g,
      personIds: gift_recipients.flatMap((r) => (r.person_id ? [r.person_id] : [])),
      groupIds: gift_recipients.flatMap((r) => (r.group_id ? [r.group_id] : [])),
    })),
  };
}
