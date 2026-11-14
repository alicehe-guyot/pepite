"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { RUBRICS } from "@/lib/persons";

// Enregistre le portrait (5 rubriques). Une rubrique vidée redevient « à compléter ».
export async function savePortrait(slug: string, _prev: string | null, formData: FormData): Promise<string | null> {
  // Les 5 rubriques du portrait, plus les notes libres (retour Alice #26 : modifiables).
  const update = Object.fromEntries(
    [...RUBRICS, { key: "description" }].map(({ key }) => {
      const value = String(formData.get(key) ?? "").trim();
      return [key, value || null];
    }),
  );
  const supabase = await createClient();
  const { error } = await supabase.from("persons").update(update).eq("slug", slug);
  if (error) return "Enregistrement impossible";
  revalidatePath(`/carnet/${slug}`);
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
