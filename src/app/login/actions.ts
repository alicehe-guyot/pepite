"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Connexion par mot de passe seul, sans email ni envoi d'email.
// Un compte par personne, chacun son mot de passe (scripts/set-password.mjs jb JB) : c'est le
// mot de passe qui dit qui entre. Chacun voit tout sauf ce que l'autre a marqué « Secret »
// (SPEC §8.5, décision du 2026-11-22).
const ACCOUNTS = ["alice", "jb"];

export async function signIn(_prev: string | null, formData: FormData): Promise<string | null> {
  const password = String(formData.get("password") ?? "");
  if (!password) return "Mot de passe requis";

  const supabase = await createClient();
  for (const account of ACCOUNTS) {
    const { error } = await supabase.auth.signInWithPassword({ email: `${account}@pepite.local`, password });
    if (!error) {
      const jar = await cookies();
      const suite = jar.get("suite")?.value;
      jar.delete("suite");
      // Seulement un chemin interne, jamais une autre adresse.
      redirect(suite?.startsWith("/") && !suite.startsWith("//") ? suite : "/agenda");
    }
    if (error.status === 429) return "Trop d’essais, patiente un peu";
  }
  return "Mot de passe incorrect";
}

// Se déconnecter (Réglages) : la session est effacée, retour à l'écran du mot de passe.
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
