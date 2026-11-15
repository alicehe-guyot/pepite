"use client";

import { useState } from "react";

// Charge les photos à joindre (liens temporaires) ; ignore celles qui échouent.
async function toFiles(photos: { url: string; name: string }[]): Promise<File[]> {
  const files = await Promise.all(
    photos.map(async (p) => {
      try {
        const blob = await (await fetch(p.url)).blob();
        return new File([blob], `${p.name.replace(/[^\p{L}\p{N} ]/gu, "").slice(0, 40) || "photo"}.jpg`, { type: blob.type || "image/jpeg" });
      } catch {
        return null;
      }
    }),
  );
  return files.filter((f): f is File => f !== null);
}

// Partage un texte (feuille de partage iOS → WhatsApp…), avec les photos des idées si possible (#88),
// sinon le copie. `copy` : copie directement.
export function ShareButton({
  text,
  label = "Partager la liste",
  copy = false,
  small = false,
  photos = [],
}: {
  text: string;
  label?: string;
  copy?: boolean;
  small?: boolean;
  photos?: { url: string; name: string }[];
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function share() {
    if (!copy && navigator.share) {
      try {
        setBusy(true);
        const files = photos.length ? await toFiles(photos) : [];
        setBusy(false);
        if (files.length && navigator.canShare?.({ text, files })) await navigator.share({ text, files });
        else await navigator.share({ text });
        return;
      } catch (e) {
        setBusy(false);
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
      disabled={busy}
      className={`${small ? "h-11 rounded-xl px-3 text-[15px] font-semibold text-accent" : "h-12 rounded-2xl bg-accent px-4 text-[16px] font-semibold text-white md:w-fit md:px-6"} disabled:opacity-60`}
    >
      {copied ? "Copié" : busy ? "Photos…" : label}
    </button>
  );
}
