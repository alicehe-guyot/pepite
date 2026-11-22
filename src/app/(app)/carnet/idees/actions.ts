"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function asUrl(text: string): URL | null {
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

// Titre d'un lien collé, lu dans l'aperçu Open Graph (SPEC US-C2 CA3). Repli : le nom du site.
async function titleFromLink(url: URL): Promise<string> {
  const fallback = url.hostname.replace(/^www\./, "");
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(3000),
      headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", Accept: "text/html" },
    });
    if (!res.ok || !res.headers.get("content-type")?.includes("html")) return fallback;
    const html = (await res.text()).slice(0, 300_000);
    const og =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1] ??
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
    const title = og && decode(og);
    return title ? title.slice(0, 200) : fallback;
  } catch {
    return fallback;
  }
}

// Crée (id null) ou modifie une idée, puis remplace ses destinataires.
export async function saveIdea(id: string | null, _prev: string | null, formData: FormData): Promise<string | null> {
  // En modification, le titre se change sur place (#75) : le formulaire ne l'envoie plus.
  const text = String(formData.get("title") ?? "").trim();
  if (!id && !text) return "Titre manquant";
  const pasted = asUrl(text);

  // Liens : celui collé dans le titre, puis les champs Liens s'ils sont affichés (sinon inchangés).
  // Le premier va dans `url`, les autres dans `links`.
  let linkFields: { url: string | null; links: string[] } | undefined;
  if (formData.has("link") || pasted) {
    const typed = formData.getAll("link").map((l) => String(l).trim()).filter(Boolean);
    const parsed = typed.map(asUrl);
    if (parsed.some((u) => !u)) return "Lien invalide";
    const all = [...new Set([...(pasted ? [pasted.href] : []), ...parsed.map((u) => u!.href)])];
    linkFields = { url: all[0] ?? null, links: all.slice(1) };
  }
  const title = pasted ? await titleFromLink(pasted) : text || undefined;

  const recipients = formData.getAll("for").map(String);
  // Secret : caché à l'autre compte (JB ou Alice), visible de moi seul.
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const uid = auth?.claims.sub;
  if (!uid) return "Session expirée";
  const hidden_by = formData.get("secret") ? uid : null;
  const categories = [...new Set(formData.getAll("categories").map(String).filter(Boolean))];
  const fields = {
    ...(title && { title }),
    ...linkFields,
    note: String(formData.get("note") ?? "").trim() || null,
    categories,
    status: recipients.length ? "sorted" : "inbox",
    hidden_by,
  };

  let ideaId = id;
  if (ideaId) {
    const { error } = await supabase.from("ideas").update(fields).eq("id", ideaId);
    if (error) return "Enregistrement impossible";
    const { error: delError } = await supabase.from("idea_recipients").delete().eq("idea_id", ideaId);
    if (delError) return "Enregistrement impossible";
    // Les cadeaux en cours tirés de l'idée suivent son secret.
    await supabase.from("gifts").update({ hidden_by }).eq("idea_id", ideaId).neq("status", "given");
  } else {
    // Identifiant créé ici, insertion sans relecture : la politique de lecture des idées
    // (private.can_see_idea) relit la table et ne voit pas encore la ligne en cours d'insertion,
    // ce qui faisait échouer tout INSERT … RETURNING (erreur 42501).
    ideaId = crypto.randomUUID();
    const { error } = await supabase.from("ideas").insert({ id: ideaId, ...fields, source: "manual" });
    if (error) return "Enregistrement impossible";
  }

  if (recipients.length) {
    const rows = recipients.map((r) => {
      const [kind, rid] = r.split(":");
      return { idea_id: ideaId, person_id: kind === "person" ? rid : null, group_id: kind === "group" ? rid : null };
    });
    const { error } = await supabase.from("idea_recipients").insert(rows);
    if (error) return "Destinataires non enregistrés";
  }

  revalidatePath("/carnet", "layout");
  const back = String(formData.get("back") ?? "");
  redirect(back.startsWith("/carnet/") ? back : "/carnet?vue=idees");
}

// Supprime l'idée (retour Alice #9 : supprimer, pas archiver). Ses cadeaux restent, sans lien vers elle.
export async function deleteIdea(id: string, back?: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("ideas").delete().eq("id", id);
  revalidatePath("/carnet", "layout");
  if (back) redirect(back);
}

// Marque l'idée comme offerte : crée un cadeau « offert » pour les mêmes destinataires,
// avec la note si elle est donnée (sinon le cadeau reste « À noter », SPEC §8.10).
export async function markGiven(id: string, rating?: "wow" | "worked" | "miss" | null, comment?: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: idea } = await supabase
    .from("ideas")
    .select("title, idea_recipients(person_id, group_id)")
    .eq("id", id)
    .single<{ title: string; idea_recipients: { person_id: string | null; group_id: string | null }[] }>();
  if (!idea) return "Idée introuvable";
  // Offerte : la surprise est passée, l'idée n'est plus secrète.
  await supabase.from("ideas").update({ hidden_by: null }).eq("id", id);
  // Même raison que pour les idées : identifiant créé ici, pas de relecture à l'insertion.
  const giftId = crypto.randomUUID();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
  const { error } = await supabase.from("gifts").insert({ id: giftId, title: idea.title, idea_id: id, status: "given", given_on: today });
  if (error) return "Enregistrement impossible";
  if (idea.idea_recipients.length) {
    const { error: e } = await supabase.from("gift_recipients").insert(idea.idea_recipients.map((r) => ({ gift_id: giftId, ...r })));
    if (e) return "Destinataires non enregistrés";
  }
  if (rating) {
    const { error: e } = await supabase.from("gift_feedback").insert({ gift_id: giftId, rating, comment: comment?.trim() || null });
    if (e) return "Note non enregistrée";
  }
  revalidatePath("/carnet", "layout");
  return null;
}

// Annule le dernier « offert » de cette idée (erreur de tap).
export async function unmarkGiven(id: string): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gifts")
    .select("id")
    .eq("idea_id", id)
    .eq("status", "given")
    .order("created_at", { ascending: false })
    .limit(1);
  if (data?.[0]) await supabase.from("gifts").delete().eq("id", data[0].id);
  revalidatePath("/carnet", "layout");
}

// Renommer une idée depuis son titre (#75).
export async function renameIdea(id: string, title: string): Promise<string | null> {
  const supabase = await createClient();
  const { error } = await supabase.from("ideas").update({ title: title.trim() }).eq("id", id);
  if (error) return "Enregistrement impossible";
  revalidatePath("/carnet", "layout");
  return null;
}
