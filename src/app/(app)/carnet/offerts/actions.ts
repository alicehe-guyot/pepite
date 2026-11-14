"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Rating } from "@/lib/gifts";

const RATINGS: Rating[] = ["wow", "worked", "miss"];

// Note un cadeau offert (Effet wow, A marché, Pas marché + commentaire).
export async function rateGift(giftId: string, rating: Rating, comment: string): Promise<void> {
  if (!RATINGS.includes(rating)) return;
  const supabase = await createClient();
  await supabase.from("gift_feedback").upsert({ gift_id: giftId, rating, comment: comment.trim() || null });
  revalidatePath("/carnet", "layout");
}

// Supprime un cadeau offert (erreur de saisie).
export async function deleteGift(giftId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("gifts").delete().eq("id", giftId);
  revalidatePath("/carnet", "layout");
}
