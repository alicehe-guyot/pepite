"use client";

import { useEffect } from "react";

// Après chaque mise en ligne, l'ancienne version restée ouverte (PWA en arrière-plan sur l'iPhone)
// appelait des actions serveur qui n'existent plus : enregistrement refusé, erreur, retour en haut
// (#66, #70, #58). Au retour sur l'app, on compare les versions et on recharge si besoin.
export function VersionWatcher({ version }: { version: string }) {
  useEffect(() => {
    let checking = false;
    async function check() {
      if (checking || document.visibilityState !== "visible") return;
      checking = true;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const { version: live } = await res.json();
        if (live && live !== version) window.location.reload();
      } catch {
        // Hors ligne : on réessaiera au prochain retour.
      } finally {
        checking = false;
      }
    }
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    const timer = window.setInterval(check, 5 * 60_000);
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
      window.clearInterval(timer);
    };
  }, [version]);
  return null;
}
