"use client";

import { useState } from "react";

// Partage un texte (feuille de partage iOS → WhatsApp…), sinon le copie.
export function ShareButton({ text, label = "Partager la liste" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (navigator.share) {
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
    <button type="button" onClick={share} className="h-12 rounded-2xl bg-ink px-4 text-[16px] font-semibold text-white">
      {copied ? "Copié" : label}
    </button>
  );
}
