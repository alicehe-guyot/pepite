"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { RUBRICS } from "@/lib/persons";

// Enregistre le portrait (5 rubriques). Une rubrique vidée redevient « à compléter ».
export async function savePortrait(slug: string, _prev: string | null, formData: FormData): Promise<string | null> {
  const update = Object.fromEntries(
    RUBRICS.map(({ key }) => {
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
