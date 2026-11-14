"use client";

import { useActionState } from "react";
import { GiftMark } from "@/components/Logo";
import { signIn } from "./actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(signIn, null);

  return (
    <main className="mx-auto flex min-h-dvh max-w-[440px] flex-col justify-center gap-8 px-4">
      <div className="flex flex-col items-start gap-3">
        <GiftMark size={88} className="-ml-2" />
        <h1 className="text-5xl font-bold">Pépite</h1>
      </div>
      <form action={action} className="flex flex-col gap-3">
        <label htmlFor="password" className="sr-only">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          placeholder="Mot de passe"
          className="h-14 rounded-2xl border border-border px-4 text-[17px] outline-accent"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-14 rounded-2xl bg-accent text-[17px] font-semibold text-white disabled:opacity-60"
        >
          Entrer
        </button>
        {error && <p className="text-muted">{error}</p>}
      </form>
    </main>
  );
}
