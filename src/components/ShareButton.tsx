"use client";

import { useState } from "react";

// Partage un texte (feuille de partage iOS → WhatsApp…), sinon le copie. `copy` : copie directement.
export function ShareButton({ text, label = "Partager la liste", copy = false, small = false }: { text: string; label?: string; copy?: boolean; small?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (!copy && navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={share}
      className={small ? "h-11 rounded-xl px-3 text-[15px] font-semibold text-accent" : "h-12 rounded-2xl bg-accent px-4 text-[16px] font-semibold text-white md:w-fit md:px-6"}
    >
      {copied ? "Copié" : label}
    </button>
  );
}
