import "server-only";
import { createClient } from "@/lib/supabase/server";

// Catégories modifiables (#69), dans l'ordre choisi.
export async function listCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("name").order("position").order("name");
  if (error) throw error;
  return (data ?? []).map((c) => c.name);
}
