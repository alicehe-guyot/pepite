"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Mes principes de cadeaux (SPEC US-N3) : un texte libre, une ligne par principe, repris dans le brief.
export async function savePrinciples(_prev: string | null, formData: FormData): Promise<string | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const uid = auth?.claims.sub;
  if (!uid) return "Session expirée";
  const text = String(formData.get("principles") ?? "").trim();
  const { error } = await supabase.from("settings").upsert({ user_id: uid, gift_principles: text || null });
  if (error) return "Enregistrement impossible";
  revalidatePath("/carnet", "layout");
  return "Enregistré";
}
