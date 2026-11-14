import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Catégories définies par Alice (SPEC §8.10, 2e retour prototype).
export const CATEGORIES = [
  "Naissance",
  "Enfants / jouets",
  "Activités",
  "Grossesse / parents",
  "Librairie",
  "Secret Santa",
  "Anniversaire ami",
] as const;

export type Recipient = { kind: "person" | "group"; id: string; slug: string; name: string };

export type Idea = {
  id: string;
  title: string;
  url: string | null;
  note: string | null;
  category: string | null;
  is_lead: boolean;
  created_at: string;
  recipients: Recipient[];
};

type IdeaRow = Omit<Idea, "recipients"> & {
  idea_recipients: {
    persons: { id: string; slug: string; name: string } | null;
    groups: { id: string; slug: string; name: string } | null;
  }[];
};

const SELECT = `id, title, url, note, category, is_lead, created_at,
  idea_recipients(persons(id, slug, name), groups(id, slug, name))`;

// Fiche liée au compte connecté : affichée « Moi ». Une seule requête par rendu.
export const myPersonId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const uid = auth?.claims.sub;
  if (!uid) return null;
  const { data } = await supabase.from("users").select("person_id").eq("id", uid).maybeSingle();
  return data?.person_id ?? null;
});

function toIdea(row: IdeaRow, me: string | null): Idea {
  const { idea_recipients, ...idea } = row;
  const recipients = idea_recipients.flatMap((r): Recipient[] => {
    if (r.persons) return [{ kind: "person", ...r.persons, name: r.persons.id === me ? "Moi" : r.persons.name }];
    if (r.groups) return [{ kind: "group", ...r.groups }];
    return [];
  });
  recipients.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return { ...idea, recipients };
}

// Idées non archivées, les plus récentes d'abord. La RLS masque déjà les idées secrètes.
export async function listIdeas(): Promise<Idea[]> {
  const supabase = await createClient();
  const [{ data, error }, me] = await Promise.all([
    supabase.from("ideas").select(SELECT).neq("status", "archived").order("created_at", { ascending: false }).returns<IdeaRow[]>(),
    myPersonId(),
  ]);
  if (error) throw error;
  return (data ?? []).map((row) => toIdea(row, me));
}

export async function getIdea(id: string): Promise<Idea | null> {
  const supabase = await createClient();
  const [{ data, error }, me] = await Promise.all([
    supabase.from("ideas").select(SELECT).eq("id", id).maybeSingle<IdeaRow>(),
    myPersonId(),
  ]);
  if (error) throw error;
  return data ? toIdea(data, me) : null;
}

// Idées d'une personne : pour elle directement ou pour un de ses groupes.
export function ideasFor(ideas: Idea[], personId: string, groupIds: string[]): Idea[] {
  return ideas.filter((i) =>
    i.recipients.some((r) => (r.kind === "person" ? r.id === personId : groupIds.includes(r.id))),
  );
}

// Choix « Pour qui » : Moi d'abord, puis les personnes, puis les groupes.
export async function recipientChoices(): Promise<Recipient[]> {
  const supabase = await createClient();
  const [persons, groups, me] = await Promise.all([
    supabase.from("persons").select("id, slug, name"),
    supabase.from("groups").select("id, slug, name"),
    myPersonId(),
  ]);
  if (persons.error) throw persons.error;
  if (groups.error) throw groups.error;
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "fr");
  const people: Recipient[] = (persons.data ?? [])
    .map((p) => ({ kind: "person" as const, ...p, name: p.id === me ? "Moi" : p.name }))
    .sort((a, b) => (a.name === "Moi" ? -1 : b.name === "Moi" ? 1 : byName(a, b)));
  const families: Recipient[] = (groups.data ?? []).map((g) => ({ kind: "group" as const, ...g })).sort(byName);
  return [...people, ...families];
}
