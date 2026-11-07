"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Connexion par email et mot de passe (pas d'email à recevoir : marche aussi dans
// l'app installée sur l'iPhone). Les comptes sont créés par scripts/set-password.mjs.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      setError(error.status === 429 ? "Trop d’essais, patiente un peu" : "Email ou mot de passe incorrect");
      return;
    }
    router.replace("/agenda");
    router.refresh();
  }

  const input = "h-14 rounded-2xl border border-border px-4 text-[17px] outline-accent";

  return (
    <main className="mx-auto flex min-h-dvh max-w-[440px] flex-col justify-center gap-8 px-4">
      <h1 className="text-5xl font-bold">Pépite</h1>
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
          className={input}
        />
        <label htmlFor="password" className="sr-only">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />
        <button
          type="submit"
          disabled={busy}
          className="h-14 rounded-2xl bg-accent text-[17px] font-semibold text-white disabled:opacity-60"
        >
          Se connecter
        </button>
        {error && <p className="text-muted">{error}</p>}
      </form>
    </main>
  );
}
