"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PersonStatus } from "@/lib/agenda";

const NEXT: Record<PersonStatus, PersonStatus> = { to_find: "lead", lead: "found", found: "given", given: "to_find" };

// Un tap fait avancer la personne : À trouver → Piste → Trouvé → Offert → À trouver.
export async function cycleStatus(eventId: string, personId: string, current: PersonStatus): Promise<void> {
  const supabase = await createClient();
  await supabase.from("event_persons").update({ status: NEXT[current] }).eq("event_id", eventId).eq("person_id", personId);
  revalidatePath("/agenda", "layout");
}

// Retire une personne de l'événement (sa fiche est gardée).
export async function removePerson(eventId: string, personId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("event_persons").delete().eq("event_id", eventId).eq("person_id", personId);
  revalidatePath("/agenda", "layout");
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
  revalidatePath("/agenda", "layout");
  if (created) revalidatePath("/carnet", "layout");
  return created ? `Fiche ${name} créée et ajoutée` : group ? `${ids.length} personnes ajoutées` : `${name} ajouté`;
}
