import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Lien magique : échange le code contre une session puis ouvre l'Agenda.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/agenda`);
  }
  return NextResponse.redirect(`${origin}/login?erreur=lien`);
}
