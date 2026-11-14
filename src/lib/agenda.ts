import "server-only";
import { createClient } from "@/lib/supabase/server";

// Agenda (SPEC §8.3 et §8.10) : événements des 90 prochains jours, avancement par personne
// et prochaine action générée, jamais saisie. Le secret est appliqué par la RLS :
// les cadeaux qu'on n'a pas le droit de voir ne remontent pas ici.

export const HORIZON_DAYS = 90;
const URGENT_DAYS = 30;

export type PersonStatus = "to_find" | "lead" | "found" | "given";

export type AgendaEvent = {
  id: string;
  title: string;
  date: Date;
  daysLeft: number;
  persons: { id: string; name: string; status: PersonStatus }[];
  found: number;
  nextAction: string | null;
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

function names(list: { name: string }[], max = 2): string {
  const shown = list.slice(0, max).map((p) => p.name);
  const rest = list.length - shown.length;
  return rest > 0 ? `${shown.join(", ")} et ${rest} autres` : shown.join(" et ");
}

// Règles §8.10, dans l'ordre d'urgence.
export function nextAction(
  persons: AgendaEvent["persons"],
  gifts: Pick<GiftRow, "title" | "status" | "format" | "needs_pickup">[],
  daysLeft: number,
): string | null {
  const activity = gifts.find((g) => (g.status === "chosen" || g.status === "to_plan") && g.format === "activity");
  if (activity) return `Réserver ${activity.title}`;
  const toOrder = gifts.find((g) => g.status === "chosen" && g.format !== "activity");
  if (toOrder) return `Commander ${toOrder.title}`;
  const pickup = gifts.find((g) => g.status === "ordered" && g.needs_pickup);
  if (pickup) return `Récupérer ${pickup.title}`;

  const toFind = persons.filter((p) => p.status === "to_find");
  const leads = persons.filter((p) => p.status === "lead");
  if (toFind.length && toFind.length === persons.length) return "Rien de choisi";
  if (toFind.length && daysLeft <= URGENT_DAYS) return `Trouver pour ${names(toFind)}`;
  if (leads.length && daysLeft <= URGENT_DAYS) return `Préciser pour ${names(leads)}`;
  if (toFind.length) return `${toFind.length} à trouver`;
  return null;
}

export async function getAgenda(): Promise<AgendaEvent[]> {
  const supabase = await createClient();
  const today = parisToday();

  const [{ data: events, error: eventsError }, { data: gifts, error: giftsError }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, date, recurrence, event_persons(status, persons(id, name))")
      .returns<EventRow[]>(),
    supabase
      .from("gifts")
      .select("title, status, format, needs_pickup, event_id")
      .not("event_id", "is", null)
      .neq("status", "given")
      .returns<GiftRow[]>(),
  ]);
  if (eventsError) throw eventsError;
  if (giftsError) throw giftsError;

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
        nextAction: nextAction(
          persons,
          (gifts ?? []).filter((g) => g.event_id === e.id),
          daysLeft,
        ),
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
