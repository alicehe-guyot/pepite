"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Connexion par mot de passe seul, sans email ni envoi d'email.
// Pour l'instant, un seul mot de passe commun ouvre le compte d'Alice : tout le monde voit tout
// (décision d'Alice du 2026-11-07, SPEC §19). Pour rétablir le secret de JB, ajouter "jb"
// ici avec son propre mot de passe (scripts/set-password.mjs jb JB).
const ACCOUNTS = ["alice"];

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
