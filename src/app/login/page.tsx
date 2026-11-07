"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Connexion par email : un code à taper ici (marche dans l'app installée sur l'iPhone,
// qui ne partage pas sa session avec Safari) ou le lien du même email.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback`, shouldCreateUser: true },
    });
    setBusy(false);
    if (error) setError(error.status === 429 ? "Trop d’essais, patiente un peu" : "Envoi impossible");
    else setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.verifyOtp({ email, token: code, type: "email" });
    if (error) {
      setBusy(false);
      setError("Code incorrect");
      return;
    }
    router.replace("/agenda");
    router.refresh();
  }

  const input = "h-14 rounded-2xl border border-border px-4 text-[17px] outline-accent";
  const button = "h-14 rounded-2xl bg-accent text-[17px] font-semibold text-white disabled:opacity-60";

  return (
    <main className="mx-auto flex min-h-dvh max-w-[440px] flex-col justify-center gap-8 px-4">
      <h1 className="text-5xl font-bold">Pépite</h1>

      {step === "email" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-3">
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
          <button type="submit" disabled={busy} className={button}>
            Recevoir le code
          </button>
          {error && <p className="text-muted">{error}</p>}
        </form>
      ) : (
        <form onSubmit={verifyCode} className="flex flex-col gap-3">
          <p className="text-lg">Code envoyé à {email}</p>
          <label htmlFor="code" className="sr-only">
            Code
          </label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6,8}"
            maxLength={8}
            required
            autoFocus
            placeholder="Code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className={`${input} text-center text-2xl tracking-[0.3em]`}
          />
          <button type="submit" disabled={busy || code.length < 6} className={button}>
            Se connecter
          </button>
          {error && <p className="text-muted">{error}</p>}
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="h-11 text-[15px] font-semibold text-muted"
          >
            Changer d’email
          </button>
        </form>
      )}
    </main>
  );
}
