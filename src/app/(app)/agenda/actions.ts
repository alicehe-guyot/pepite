"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Parcours d'un cadeau dans un événement (#40) : À trouver → Choisi → Acheté → Prêt → Offert.
// Les cadeaux sont créés avec un identifiant fait ici et sans relecture (voir supabase/tests/insert.test.sql).

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
const refresh = () => {
  revalidatePath("/agenda", "layout");
  revalidatePath("/carnet", "layout");
};

// Retenir une idée : elle devient le cadeau de l'événement, pour les mêmes destinataires.
export async function chooseIdea(eventId: string, ideaId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: idea } = await supabase
    .from("ideas")
    .select("title, idea_recipients(person_id, group_id)")
    .eq("id", ideaId)
    .single<{ title: string; idea_recipients: { person_id: string | null; group_id: string | null }[] }>();
  if (!idea) return "Idée introuvable";
  const id = crypto.randomUUID();
  const { error } = await supabase.from("gifts").insert({ id, title: idea.title, idea_id: ideaId, event_id: eventId, status: "chosen" });
  if (error) return "Enregistrement impossible";
  if (idea.idea_recipients.length) {
    const { error: e } = await supabase.from("gift_recipients").insert(idea.idea_recipients.map((r) => ({ gift_id: id, ...r })));
    if (e) return "Destinataires non enregistrés";
  }
  refresh();
  return null;
}

// Retenir un cadeau qui n'était pas dans les idées.
export async function chooseNew(eventId: string, personId: string, _prev: string | null, formData: FormData): Promise<string | null> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return "Quoi ?";
  const supabase = await createClient();
  const id = crypto.randomUUID();
  const { error } = await supabase.from("gifts").insert({ id, title, event_id: eventId, status: "chosen" });
  if (error) return "Enregistrement impossible";
  const { error: e } = await supabase.from("gift_recipients").insert({ gift_id: id, person_id: personId });
  if (e) return "Destinataire non enregistré";
  refresh();
  return null;
}

// Étape suivante : acheté (avec « à récupérer » éventuel), puis prêt.
export async function setGiftStep(giftId: string, status: "chosen" | "ordered" | "ready", pickup?: string): Promise<string | null> {
  const supabase = await createClient();
  const fields = status === "ordered" ? { status, needs_pickup: Boolean(pickup), pickup_place: pickup || null } : { status };
  const { error } = await supabase.from("gifts").update(fields).eq("id", giftId);
  if (error) return "Enregistrement impossible";
  refresh();
  return null;
}

// Offert : date du jour et note (facultative, sinon « À noter »).
export async function giveGift(giftId: string, rating: "wow" | "worked" | "miss" | null, comment = ""): Promise<string | null> {
  const supabase = await createClient();
  const { error } = await supabase.from("gifts").update({ status: "given", given_on: today() }).eq("id", giftId);
  if (error) return "Enregistrement impossible";
  if (rating) {
    const { error: e } = await supabase.from("gift_feedback").upsert({ gift_id: giftId, rating, comment: comment.trim() || null });
    if (e) return "Note non enregistrée";
  }
  refresh();
  return null;
}

// Changer d'avis : le cadeau est retiré, la personne repasse « À trouver » (l'idée reste dans le carnet).
export async function dropGift(giftId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("gifts").delete().eq("id", giftId);
  refresh();
}

// Retire une personne de l'événement (sa fiche est gardée).
export async function removePerson(eventId: string, personId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("event_persons").delete().eq("event_id", eventId).eq("person_id", personId);
  refresh();
}

function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "personne"
  );
}

// Ajoute une personne, ou tous les membres d'un groupe. Un nom inconnu crée sa fiche.
export async function addToEvent(eventId: string, _prev: string | null, formData: FormData): Promise<string | null> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return null;
  const supabase = await createClient();
  const same = (a: string) => a.localeCompare(name, "fr", { sensitivity: "base" }) === 0;

  const [{ data: persons }, { data: groups }] = await Promise.all([
    supabase.from("persons").select("id, name, slug"),
    supabase.from("groups").select("name, group_members(person_id)"),
  ]);
  let ids: string[] = [];
  let created = false;
  const group = groups?.find((g) => same(g.name));
  const person = persons?.find((p) => same(p.name));
  if (group) ids = group.group_members.map((m) => m.person_id);
  else if (person) ids = [person.id];
  else {
    const taken = new Set(persons?.map((p) => p.slug));
    const base = slugify(name);
    let slug = base;
    for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
    const { data, error } = await supabase.from("persons").insert({ name, slug }).select("id").single();
    if (error || !data) return "Fiche non créée";
    ids = [data.id];
    created = true;
  }

  const { error } = await supabase
    .from("event_persons")
    .upsert(ids.map((person_id) => ({ event_id: eventId, person_id })), { onConflict: "event_id,person_id", ignoreDuplicates: true });
  if (error) return "Ajout impossible";
  refresh();
  return created ? `Fiche ${name} créée et ajoutée` : group ? `${ids.length} personnes ajoutées` : `${name} ajouté`;
}
