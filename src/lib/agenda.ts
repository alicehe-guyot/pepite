import "server-only";
import { createClient } from "@/lib/supabase/server";

// Agenda (SPEC §8.3 et §8.10) : événements des 90 prochains jours et avancement par personne.
// La « prochaine action » sous chaque événement a été retirée (retour Alice #24 : peu fiable).
// Le secret est appliqué par la RLS : les cadeaux qu'on n'a pas le droit de voir ne remontent pas ici.

export const HORIZON_DAYS = 90;

export type PersonStatus = "to_find" | "lead" | "found" | "given";

export type AgendaEvent = {
  id: string;
  title: string;
  date: Date;
  daysLeft: number;
  persons: { id: string; name: string; status: PersonStatus }[];
  found: number;
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
  format: "object" | "activity" | "voucher" | "shared_experience" | null;
  needs_pickup: boolean;
  event_id: string;
};

// Minuit, heure de Paris, exprimé comme une date UTC (pour compter les jours sans décalage).
function parisToday(now = new Date()): Date {
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

export async function getAgenda(): Promise<AgendaEvent[]> {
  const supabase = await createClient();
  const today = parisToday();

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, title, date, recurrence, event_persons(status, persons(id, name))")
    .returns<EventRow[]>();
  if (eventsError) throw eventsError;

  return (events ?? [])
    .map((e) => {
      const date = nextOccurrence(e.date, e.recurrence, today);
      const daysLeft = Math.round((date.getTime() - today.getTime()) / 86_400_000);
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
      };
    })
    .filter((e) => e.daysLeft >= 0 && e.daysLeft <= HORIZON_DAYS)
    .sort((a, b) => a.daysLeft - b.daysLeft);
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
