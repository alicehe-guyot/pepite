"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Ajouter une catégorie (#69).
export async function addCategory(_prev: string | null, formData: FormData): Promise<string | null> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return null;
  const supabase = await createClient();
  const { count } = await supabase.from("categories").select("id", { count: "exact", head: true });
  const { error } = await supabase.from("categories").insert({ name, position: (count ?? 0) + 1 });
  if (error) return error.code === "23505" ? "Elle existe déjà" : "Ajout impossible";
  revalidatePath("/carnet", "layout");
  return null;
}

// Supprimer une catégorie : elle disparaît aussi des idées et des cadeaux qui l'avaient.
export async function deleteCategory(name: string): Promise<void> {
  const supabase = await createClient();
  for (const table of ["ideas", "gifts"] as const) {
    const { data } = await supabase.from(table).select("id, categories").contains("categories", [name]);
    for (const row of data ?? []) {
      await supabase
        .from(table)
        .update({ categories: (row.categories as string[]).filter((c) => c !== name) })
        .eq("id", row.id);
    }
  }
  await supabase.from("categories").delete().eq("name", name);
  revalidatePath("/carnet", "layout");
}
