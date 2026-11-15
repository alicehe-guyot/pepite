"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { setPhoto } from "@/app/(app)/carnet/actions";

// Réduit la photo (1600 px max, JPEG) avant l'envoi : rapide en 4G, peu de stockage.
async function shrink(file: File): Promise<Blob> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("photo"))), "image/jpeg", 0.85));
}

// Photo d'une fiche (rond) ou d'une idée (vignette large) : un tap pour choisir ou prendre une photo (#88).
export function PhotoPicker({
  kind,
  id,
  url,
  fallback,
  shape = "round",
}: {
  kind: "persons" | "ideas";
  id: string;
  url: string | null;
  fallback?: string;
  shape?: "round" | "wide";
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pick(file: File | undefined) {
    if (!file) return;
    start(async () => {
      try {
        const blob = await shrink(file);
        const path = `${kind}/${id}/${crypto.randomUUID()}.jpg`;
        const { error: upError } = await createClient().storage.from("photos").upload(path, blob, { contentType: "image/jpeg" });
        if (upError) return setError("Envoi impossible");
        setError(await setPhoto(kind, id, path));
      } catch {
        setError("Photo illisible");
      }
    });
  }

  const box =
    shape === "round"
      ? "h-16 w-16 rounded-full text-[22px]"
      : url
        ? "aspect-[4/3] w-full max-w-sm rounded-2xl"
        : "h-11 w-fit rounded-xl px-4 text-[15px]"; // sans photo : un simple bouton, pas un grand cadre vide

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={pending}
        aria-label={url ? "Changer la photo" : "Ajouter une photo"}
        className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-surface font-bold text-muted ${box} ${pending ? "opacity-60" : ""}`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : shape === "round" ? (
          fallback
        ) : (
          <span className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
              <path d="M2.5 6.5h3l1.5-2h6l1.5 2h3v10h-15z" />
              <circle cx="10" cy="11" r="3" />
            </svg>
            Ajouter une photo
          </span>
        )}
      </button>
      {url && shape === "wide" && (
        <button type="button" disabled={pending} onClick={() => start(async () => setError(await setPhoto(kind, id, null)))} className="flex h-11 w-fit items-center text-[14px] font-semibold text-muted">
          Retirer la photo
        </button>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      {error && <span className="text-[14px] font-semibold text-accent">{error}</span>}
    </div>
  );
}
