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
  const text = String(formData.get("title") ?? "").trim();
  const linkField = formData.has("url") ? String(formData.get("url") ?? "").trim() : null;
  if (!text) return "Titre manquant";

  const pasted = asUrl(text);
  // Lien : collé dans le titre, sinon le champ Lien (vidé → effacé), sinon inchangé.
  const url = pasted ? pasted.href : linkField === null ? undefined : linkField ? (asUrl(linkField)?.href ?? null) : null;
  if (linkField && !url) return "Lien invalide";
  const title = pasted ? await titleFromLink(pasted) : text;

  const recipients = formData.getAll("for").map(String);
  const category = String(formData.get("category") ?? "") || null;
  const fields = {
    title,
    ...(url !== undefined && { url }),
    note: String(formData.get("note") ?? "").trim() || null,
    category,
    is_lead: formData.get("is_lead") === "on",
    status: recipients.length ? "sorted" : "inbox",
  };

  const supabase = await createClient();
  let ideaId = id;
  if (ideaId) {
    const { error } = await supabase.from("ideas").update(fields).eq("id", ideaId);
    if (error) return "Enregistrement impossible";
    const { error: delError } = await supabase.from("idea_recipients").delete().eq("idea_id", ideaId);
    if (delError) return "Enregistrement impossible";
  } else {
    const { data, error } = await supabase.from("ideas").insert({ ...fields, source: "manual" }).select("id").single();
    if (error || !data) return "Enregistrement impossible";
    ideaId = data.id;
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
  redirect("/carnet?vue=idees");
}

// Archiver : l'idée sort du carnet sans être effacée (SPEC US-C3 CA2).
export async function archiveIdea(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("ideas").update({ status: "archived" }).eq("id", id);
  revalidatePath("/carnet", "layout");
  redirect("/carnet?vue=idees");
}
