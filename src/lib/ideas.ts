import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { signPhotos } from "@/lib/photos";


export type Recipient = { kind: "person" | "group"; id: string; slug: string; name: string };

export type Idea = {
  id: string;
  title: string;
  url: string | null;
  links: string[];
  note: string | null;
  categories: string[];
  is_lead: boolean;
  created_at: string;
  recipients: Recipient[];
  secret: boolean; // cachée par moi : l'autre ne la voit pas
  given: boolean; // déjà offerte : au moins un cadeau offert issu de cette idée
  image_path: string | null;
  imageUrl: string | null; // lien temporaire vers la photo (#88)
};

type IdeaRow = Omit<Idea, "recipients" | "given" | "imageUrl" | "secret"> & {
  hidden_by: string | null;
  gifts: { status: string }[];
  idea_recipients: {
    persons: { id: string; slug: string; name: string } | null;
    groups: { id: string; slug: string; name: string } | null;
  }[];
};

const SELECT = `id, title, url, links, note, categories, is_lead, image_path, created_at, hidden_by,
  idea_recipients(persons(id, slug, name), groups(id, slug, name)), gifts(status)`;

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
  const { idea_recipients, gifts, hidden_by, ...idea } = row;
  const recipients = idea_recipients.flatMap((r): Recipient[] => {
    if (r.persons) return [{ kind: "person", ...r.persons, name: r.persons.id === me ? "Moi" : r.persons.name }];
    if (r.groups) return [{ kind: "group", ...r.groups }];
    return [];
  });
  recipients.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return { ...idea, recipients, secret: hidden_by !== null, given: gifts.some((g) => g.status === "given"), imageUrl: null };
}

// Idées non archivées, les plus récentes d'abord. La RLS masque déjà les idées cachées par l'autre.
export async function listIdeas(): Promise<Idea[]> {
  const supabase = await createClient();
  const [{ data, error }, me] = await Promise.all([
    supabase.from("ideas").select(SELECT).neq("status", "archived").order("created_at", { ascending: false }).returns<IdeaRow[]>(),
    myPersonId(),
  ]);
  if (error) throw error;
  const ideas = (data ?? []).map((row) => toIdea(row, me));
  const urls = await signPhotos(ideas.map((i) => i.image_path));
  return ideas.map((i) => ({ ...i, imageUrl: i.image_path ? (urls[i.image_path] ?? null) : null }));
}

export async function getIdea(id: string): Promise<Idea | null> {
  const supabase = await createClient();
  const [{ data, error }, me] = await Promise.all([
    supabase.from("ideas").select(SELECT).eq("id", id).maybeSingle<IdeaRow>(),
    myPersonId(),
  ]);
  if (error) throw error;
  if (!data) return null;
  const idea = toIdea(data, me);
  const urls = await signPhotos([idea.image_path]);
  return { ...idea, imageUrl: idea.image_path ? (urls[idea.image_path] ?? null) : null };
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

// Idées d'un groupe : pour le groupe lui-même ou pour un de ses membres.
export function ideasForGroup(ideas: Idea[], groupId: string, memberIds: string[]): Idea[] {
  return ideas.filter((i) =>
    i.recipients.some((r) => (r.kind === "group" ? r.id === groupId : memberIds.includes(r.id))),
  );
}

// Liste à partager (WhatsApp…) : idées pas encore offertes, une section par personne.
export function shareText(title: string, sections: { name: string; ideas: Idea[]; sizes?: string | null }[]): string {
  const line = (i: Idea) =>
    [`- ${i.title}${i.note ? ` (${i.note.replace(/\s+/g, " ")})` : ""}`, ...[i.url, ...i.links].filter(Boolean).map((l) => `  ${l}`)].join("\n");
  const blocks = sections
    .map((s) => ({ ...s, ideas: s.ideas.filter((i) => !i.given) }))
    .filter((s) => s.ideas.length)
    .map((s) => `${s.name}${s.sizes ? ` (${s.sizes.replace(/\s+/g, " ").trim()})` : ""}\n${s.ideas.map(line).join("\n")}`);
  return [title, ...blocks].join("\n\n");
}
