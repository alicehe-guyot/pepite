"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback`, shouldCreateUser: false },
    });
    setState(error ? "error" : "sent");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-5">
      <h1 className="text-5xl font-bold">Pépite</h1>
      {state === "sent" ? (
        <p className="text-lg">Lien envoyé à {email}.</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 rounded-2xl border border-border px-4 text-[17px] outline-accent"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="h-14 rounded-2xl bg-accent text-[17px] font-semibold text-white disabled:opacity-60"
          >
            Recevoir le lien
          </button>
          {state === "error" && <p className="text-muted">Adresse inconnue ou erreur d’envoi.</p>}
        </form>
      )}
    </main>
  );
}
