"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Connexion par mot de passe seul, sans email ni envoi d'email.
// Chaque personne a son compte interne <prénom>@pepite.local et son propre mot de passe :
// le mot de passe suffit à savoir qui entre, et le secret de JB tient (SPEC §8.5).
// Les comptes sont créés par scripts/set-password.mjs.
const ACCOUNTS = ["alice", "jb"];

export async function signIn(_prev: string | null, formData: FormData): Promise<string | null> {
  const password = String(formData.get("password") ?? "");
  if (!password) return "Mot de passe requis";

  const supabase = await createClient();
  for (const account of ACCOUNTS) {
    const { error } = await supabase.auth.signInWithPassword({ email: `${account}@pepite.local`, password });
    if (!error) redirect("/agenda");
    if (error.status === 429) return "Trop d’essais, patiente un peu";
  }
  return "Mot de passe incorrect";
}
