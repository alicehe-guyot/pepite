"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

// Date à laquelle le cadeau a été offert (vide : inconnue).
export async function setGiftDate(giftId: string, date: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("gifts").update({ given_on: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null }).eq("id", giftId);
  revalidatePath("/carnet", "layout");
}

// Catégories d'un cadeau offert.
export async function setGiftCategories(giftId: string, categories: string[]): Promise<void> {
  const supabase = await createClient();
  await supabase.from("gifts").update({ categories }).eq("id", giftId);
  revalidatePath("/carnet", "layout");
}

// Supprime un cadeau offert (erreur de saisie).
export async function deleteGift(giftId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("gifts").delete().eq("id", giftId);
  revalidatePath("/carnet", "layout");
}

// Ajoute un cadeau déjà offert (retour Alice #56) : quoi, pour qui, quand, à quelle occasion, et la note.
// Identifiant créé ici et insertion sans relecture (voir supabase/tests/insert.test.sql).
export async function addGivenGift(_prev: string | null, formData: FormData): Promise<string | null> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return "Quoi ?";
  const recipients = formData.getAll("for").map(String);
  if (!recipients.length) return "Pour qui ?";
  const date = String(formData.get("given_on") ?? "");
  const rating = String(formData.get("rating") ?? "") as Rating | "";
  const comment = String(formData.get("comment") ?? "").trim();

  const supabase = await createClient();
  const id = crypto.randomUUID();
  const { error } = await supabase.from("gifts").insert({
    id,
    title,
    status: "given",
    given_on: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    event_label: String(formData.get("occasion") ?? "").trim() || null,
    categories: [...new Set(formData.getAll("categories").map(String).filter(Boolean))],
  });
  if (error) return "Enregistrement impossible";
  const { error: rError } = await supabase.from("gift_recipients").insert(
    recipients.map((r) => {
      const [kind, rid] = r.split(":");
      return { gift_id: id, person_id: kind === "person" ? rid : null, group_id: kind === "group" ? rid : null };
    }),
  );
  if (rError) return "Destinataires non enregistrés";
  if (RATINGS.includes(rating as Rating) || comment) {
    if (!RATINGS.includes(rating as Rating)) return "Choisis une note pour garder le commentaire";
    const { error: fError } = await supabase.from("gift_feedback").insert({ gift_id: id, rating, comment: comment || null });
    if (fError) return "Note non enregistrée";
  }
  revalidatePath("/carnet", "layout");
  const back = String(formData.get("back") ?? "");
  redirect(back.startsWith("/carnet/") ? back : "/carnet?vue=offerts");
}
