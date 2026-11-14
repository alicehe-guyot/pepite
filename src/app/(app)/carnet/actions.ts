"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Enregistre le portrait (5 rubriques). Une rubrique vidée redevient « à compléter ».
export async function saveNotes(slug: string, _prev: string | null, formData: FormData): Promise<string | null> {
  // Tout le portrait tient dans les Notes (retour Alice #64) ; les 5 rubriques ne sont plus utilisées.
  const description = String(formData.get("description") ?? "").trim() || null;
  const supabase = await createClient();
  const { error } = await supabase.from("persons").update({ description }).eq("slug", slug);
  if (error) return "Enregistrement impossible";
  revalidatePath("/carnet", "layout");
  return "Enregistré";
}

// Ville (seule info gardée à part des Notes, #64).
export async function saveCity(slug: string, _prev: string | null, formData: FormData): Promise<string | null> {
  const city = String(formData.get("city") ?? "").trim() || null;
  const supabase = await createClient();
  const { error } = await supabase.from("persons").update({ city }).eq("slug", slug);
  if (error) return "Enregistrement impossible";
  revalidatePath("/carnet", "layout");
  return "Enregistré";
}

// Renomme un groupe (ex. « Opa & Mamine »).
export async function renameGroup(slug: string, _prev: string | null, formData: FormData): Promise<string | null> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return "Nom manquant";
  const supabase = await createClient();
  const { error } = await supabase.from("groups").update({ name }).eq("slug", slug);
  if (error) return "Enregistrement impossible";
  revalidatePath("/carnet", "layout");
  return "Enregistré";
}

// Enregistre la date de naissance (jour, mois, année facultatifs) et tient à jour
// l'anniversaire récurrent dans l'Agenda (SPEC US-A1 CA1).
export async function saveBirthday(slug: string, _prev: string | null, formData: FormData): Promise<string | null> {
  const num = (k: string) => {
    const v = Number(String(formData.get(k) ?? "").trim());
    return Number.isInteger(v) && v > 0 ? v : null;
  };
  const day = num("day");
  const month = num("month");
  const year = num("year");
  if ((day && (day > 31 || !month)) || (month && month > 12) || (year && (year < 1900 || year > 2100))) return "Date invalide";

  const supabase = await createClient();
  const { data: person, error } = await supabase
    .from("persons")
    .update({ birth_day: day, birth_month: month, birth_year: year })
    .eq("slug", slug)
    .select("id, name")
    .single();
  if (error || !person) return "Enregistrement impossible";

  if (day && month) {
    const date = `${year ?? new Date().getFullYear()}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const { data: existing } = await supabase.from("events").select("id").eq("type", "birthday").eq("person_id", person.id).maybeSingle();
    if (existing) {
      await supabase.from("events").update({ date }).eq("id", existing.id);
    } else {
      const { data: event } = await supabase
        .from("events")
        .insert({ type: "birthday", title: `Anniversaire ${person.name}`, date, recurrence: "yearly", person_id: person.id })
        .select("id")
        .single();
      if (event) await supabase.from("event_persons").insert({ event_id: event.id, person_id: person.id });
    }
  }
  revalidatePath("/carnet", "layout");
  revalidatePath("/agenda", "layout");
  return "Enregistré";
}

// Budget habituel pour cette personne, en euros (vide : pas de budget).
export async function saveBudget(slug: string, _prev: string | null, formData: FormData): Promise<string | null> {
  const raw = String(formData.get("budget") ?? "").replace(/[^\d]/g, "");
  const budget = raw ? Number(raw) : null;
  const supabase = await createClient();
  const { error } = await supabase.from("persons").update({ budget_max: budget }).eq("slug", slug);
  if (error) return "Enregistrement impossible";
  revalidatePath("/carnet", "layout");
  return "Enregistré";
}

function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "fiche"
  );
}

async function freeSlug(table: "persons" | "groups", name: string): Promise<string> {
  const supabase = await createClient();
  const base = slugify(name);
  const { data } = await supabase.from(table).select("slug").like("slug", `${base}%`);
  const taken = new Set((data ?? []).map((r) => r.slug));
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}

// Renommer une personne (le lien de sa fiche ne change pas).
export async function renamePerson(slug: string, name: string): Promise<string | null> {
  const supabase = await createClient();
  const { error } = await supabase.from("persons").update({ name: name.trim() }).eq("slug", slug);
  if (error) return "Enregistrement impossible";
  revalidatePath("/carnet", "layout");
  revalidatePath("/agenda", "layout");
  return null;
}

export async function renameGroupTo(slug: string, name: string): Promise<string | null> {
  const supabase = await createClient();
  const { error } = await supabase.from("groups").update({ name: name.trim() }).eq("slug", slug);
  if (error) return "Enregistrement impossible";
  revalidatePath("/carnet", "layout");
  return null;
}

// Créer une personne ou un groupe depuis le Carnet (#77), puis ouvrir sa page.
export async function createPerson(_prev: string | null, formData: FormData): Promise<string | null> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return null;
  const supabase = await createClient();
  const slug = await freeSlug("persons", name);
  const { error } = await supabase.from("persons").insert({ name, slug });
  if (error) return "Création impossible";
  revalidatePath("/carnet", "layout");
  redirect(`/carnet/${slug}`);
}

export async function createGroup(_prev: string | null, formData: FormData): Promise<string | null> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return null;
  const supabase = await createClient();
  const slug = await freeSlug("groups", name);
  const { error } = await supabase.from("groups").insert({ name, slug, kind: "transverse" });
  if (error) return "Création impossible";
  revalidatePath("/carnet", "layout");
  redirect(`/carnet/groupe/${slug}`);
}

// Membres d'un groupe : ajouter ou retirer une personne.
export async function toggleMember(groupId: string, personId: string, member: boolean): Promise<void> {
  const supabase = await createClient();
  if (member) await supabase.from("group_members").delete().eq("group_id", groupId).eq("person_id", personId);
  else await supabase.from("group_members").insert({ group_id: groupId, person_id: personId });
  revalidatePath("/carnet", "layout");
}

// Supprimer une fiche ou un groupe : ses idées et cadeaux restent, sans ce destinataire.
export async function deletePerson(slug: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("persons").delete().eq("slug", slug);
  revalidatePath("/carnet", "layout");
  revalidatePath("/agenda", "layout");
  redirect("/carnet");
}

export async function deleteGroup(slug: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("groups").delete().eq("slug", slug);
  revalidatePath("/carnet", "layout");
  redirect("/carnet");
}
