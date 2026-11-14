import "server-only";
import { createClient } from "@/lib/supabase/server";
import { eventsBetween, parisToday } from "@/lib/agenda";
import type { GivenGift } from "@/lib/gifts";
import type { Idea } from "@/lib/ideas";
import { age, type Person } from "@/lib/persons";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" });
const clean = (s: string) => s.replace(/\s+/g, " ").trim().replace(/[.\s]+$/, "");

// « Mes principes » du compte connecté (réglages).
export async function myPrinciples(): Promise<string | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const uid = auth?.claims.sub;
  if (!uid) return null;
  const { data } = await supabase.from("settings").select("gift_principles").eq("user_id", uid).maybeSingle();
  return data?.gift_principles ?? null;
}

// Événements à venir de la personne dans l'année (anniversaire, Noël…), le plus proche d'abord.
export async function upcomingEventsFor(personId: string): Promise<{ id: string; title: string; date: Date }[]> {
  const today = parisToday();
  const events = await eventsBetween(today, new Date(today.getTime() + 366 * 86_400_000));
  return events.filter((e) => e.persons.some((p) => p.id === personId));
}

// Brief pour Instinct (SPEC §8.10) : centré sur la personne, sans adresse ni nom de famille.
export function buildBrief(
  person: Person,
  opts: { ideas: Idea[]; gifts: GivenGift[]; principles: string | null; event: { title: string; date: Date } | null },
): string {
  const a = age(person);
  const head = [person.name, a !== null ? (a < 1 ? "bébé" : `${a} ans`) : null, person.city].filter(Boolean).join(", ");
  const lines = [`Idée cadeau pour ${head}.`];
  if (opts.event) lines.push(`Occasion : ${opts.event.title}, le ${dateFormat.format(opts.event.date)}.`);
  if (person.budget_max) lines.push(`Budget : jusqu'à ${person.budget_max} €.`);
  // Les notes contiennent tout le portrait (#64), une info par ligne.
  if (person.description) lines.push(...person.description.split("\n").map(clean).filter(Boolean).map((l) => `${l}.`));
  const worked = opts.gifts.filter((g) => g.rating === "wow" || g.rating === "worked");
  const missed = opts.gifts.filter((g) => g.rating === "miss");
  if (worked.length) lines.push(`A marché : ${worked.map((g) => g.title + (g.rating === "wow" ? " (effet wow)" : "")).join(", ")}.`);
  if (missed.length) lines.push(`Pas marché : ${missed.map((g) => g.title + (g.comment ? ` (${clean(g.comment)})` : "")).join(", ")}.`);
  if (opts.ideas.length) lines.push(`Déjà en tête : ${opts.ideas.map((i) => i.title + (i.note ? ` (${clean(i.note)})` : "")).join(", ")}.`);
  if (opts.principles) lines.push(`Mes principes : ${opts.principles.split("\n").map(clean).filter(Boolean).join(" ; ")}.`);
  lines.push(
    opts.ideas.length
      ? "Dis-moi ce que tu penses de mes idées, puis propose 5 autres idées précises avec lien, prix et pourquoi ça lui irait."
      : "Propose 5 idées précises avec lien, prix et pourquoi ça lui irait.",
  );
  return lines.join("\n");
}
