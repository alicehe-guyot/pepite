import "server-only";
import { createClient } from "@/lib/supabase/server";

// Agenda (SPEC §8.3 et §8.10) : événements et avancement par personne.
// 3 vues (#22) : Prochains, Mois, Statut. Un statut par occurrence, avec sa couleur.
// Parcours d'un cadeau (#40) : À trouver → Choisi → Acheté → Prêt → Offert. L'avancement d'une
// personne et le statut d'un événement se déduisent des cadeaux rattachés à l'événement.
// Le secret est appliqué par la RLS : les cadeaux qu'on n'a pas le droit de voir ne remontent pas ici.

export const HORIZON_DAYS = 90;
export const STATUS_WINDOW_DAYS = 30; // un événement entre dans la vue Statut à moins d'un mois

export type Step = "to_find" | "chosen" | "ordered" | "ready" | "given";
export type EventStatus = "todo" | "progress" | "ready" | "past";

export const STEP_LABEL: Record<Step, string> = {
  to_find: "À trouver",
  chosen: "Choisi",
  ordered: "Acheté",
  ready: "Prêt",
  given: "Offert",
};

type GiftStatus = "chosen" | "to_plan" | "ordered" | "ready" | "given";

export type EventGift = {
  id: string;
  title: string;
  status: GiftStatus;
  needsPickup: boolean;
  pickupPlace: string | null;
  createdAt: Date;
  personIds: string[];
  groupIds: string[];
};

export type EventPerson = { id: string; slug: string; name: string; step: Step; gift: EventGift | null };

export type AgendaEvent = {
  id: string;
  title: string;
  date: Date; // occurrence affichée
  daysLeft: number; // négatif si passé
  persons: EventPerson[];
  found: number; // personnes prêtes (cadeau prêt ou offert)
  status: EventStatus;
  auto: EventStatus; // statut calculé, avant un éventuel déplacement à la main
};

type EventRow = {
  id: string;
  title: string;
  date: string;
  recurrence: "yearly" | "none";
  status_override: "todo" | "progress" | "ready" | null;
  status_override_on: string | null;
  event_persons: { persons: { id: string; slug: string; name: string } | null }[];
  gifts: {
    id: string;
    title: string;
    status: GiftStatus;
    needs_pickup: boolean;
    pickup_place: string | null;
    created_at: string;
    gift_recipients: { person_id: string | null; group_id: string | null }[];
  }[];
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

const STEP_OF: Record<GiftStatus, Step> = { chosen: "chosen", to_plan: "chosen", ordered: "ordered", ready: "ready", given: "given" };

// Étape d'une personne : celle de son cadeau pour cet événement (direct ou via un de ses groupes).
function personStep(personId: string, groupIds: string[], gifts: EventGift[]): { step: Step; gift: EventGift | null } {
  const gift = gifts.find((g) => g.personIds.includes(personId) || g.groupIds.some((id) => groupIds.includes(id))) ?? null;
  return { step: gift ? STEP_OF[gift.status] : "to_find", gift };
}

// Pas commencé : rien de choisi. En cours : au moins un cadeau, pas tous prêts. Prêt : tous prêts ou offerts.
export function eventStatus(steps: Step[], daysLeft: number): EventStatus {
  if (daysLeft < 0) return "past";
  if (steps.length && steps.every((s) => s === "ready" || s === "given")) return "ready";
  if (steps.some((s) => s !== "to_find")) return "progress";
  return "todo";
}

type Loaded = { events: EventRow[]; groupsOf: Map<string, string[]> };

async function load(eventId?: string): Promise<Loaded> {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select(
      `id, title, date, recurrence, status_override, status_override_on, event_persons(persons(id, slug, name)),
       gifts(id, title, status, needs_pickup, pickup_place, created_at, gift_recipients(person_id, group_id))`,
    );
  if (eventId) query = query.eq("id", eventId);
  const [{ data, error }, { data: members, error: mError }] = await Promise.all([
    query.returns<EventRow[]>(),
    supabase.from("group_members").select("group_id, person_id"),
  ]);
  if (error) throw error;
  if (mError) throw mError;
  const groupsOf = new Map<string, string[]>();
  for (const m of members ?? []) groupsOf.set(m.person_id, [...(groupsOf.get(m.person_id) ?? []), m.group_id]);
  return { events: data ?? [], groupsOf };
}

function toAgendaEvent(e: EventRow, date: Date, today: Date, groupsOf: Map<string, string[]>): AgendaEvent {
  const daysLeft = Math.round((date.getTime() - today.getTime()) / DAY);
  // Un événement annuel garde ses cadeaux d'une année sur l'autre : seuls comptent ceux de l'année écoulée.
  const since = e.recurrence === "yearly" ? date.getTime() - 330 * DAY : -Infinity;
  const gifts: EventGift[] = e.gifts
    .filter((g) => new Date(g.created_at).getTime() >= since)
    .map((g) => ({
      id: g.id,
      title: g.title,
      status: g.status,
      needsPickup: g.needs_pickup,
      pickupPlace: g.pickup_place,
      createdAt: new Date(g.created_at),
      personIds: g.gift_recipients.flatMap((r) => (r.person_id ? [r.person_id] : [])),
      groupIds: g.gift_recipients.flatMap((r) => (r.group_id ? [r.group_id] : [])),
    }));
  const persons = e.event_persons
    .flatMap((ep) => (ep.persons ? [ep.persons] : []))
    .map((p) => ({ ...p, ...personStep(p.id, groupsOf.get(p.id) ?? [], gifts) }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const auto = eventStatus(
    persons.map((p) => p.step),
    daysLeft,
  );
  // Déplacé à la main (#39) : vaut pour cette occurrence seulement, et jamais pour un événement passé.
  const iso = date.toISOString().slice(0, 10);
  const status = auto !== "past" && e.status_override && e.status_override_on === iso ? e.status_override : auto;
  return {
    id: e.id,
    title: e.title,
    date,
    daysLeft,
    persons,
    found: persons.filter((p) => p.step === "ready" || p.step === "given").length,
    status,
    auto,
  };
}

// Toutes les occurrences entre deux dates, triées.
export async function eventsBetween(from: Date, to: Date): Promise<AgendaEvent[]> {
  const today = parisToday();
  const { events, groupsOf } = await load();
  return events
    .flatMap((e) => occurrencesBetween(e.date, e.recurrence, from, to).map((d) => toAgendaEvent(e, d, today, groupsOf)))
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

// Vue d'un événement : sa prochaine occurrence (ou sa date, s'il est ponctuel).
export async function getEvent(id: string): Promise<AgendaEvent | null> {
  const today = parisToday();
  const { events, groupsOf } = await load(id);
  const e = events[0];
  if (!e) return null;
  return toAgendaEvent(e, nextOccurrence(e.date, e.recurrence, today), today, groupsOf);
}
