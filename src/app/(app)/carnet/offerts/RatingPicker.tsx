"use client";

import { useState } from "react";

export const RATING_LABEL = { wow: "Effet wow", worked: "A marché", miss: "Pas marché" } as const;
type Rating = keyof typeof RATING_LABEL;

// Les 3 niveaux de notation + commentaire (SPEC §8.10). « Plus tard » laisse le cadeau « À noter ».
export function RatingPicker({
  initial,
  comment: initialComment,
  onRate,
  onLater,
  pending,
}: {
  initial?: Rating | null;
  comment?: string | null;
  onRate: (rating: Rating, comment: string) => void;
  onLater?: () => void;
  pending?: boolean;
}) {
  const [comment, setComment] = useState(initialComment ?? "");
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-bg p-3">
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(RATING_LABEL) as Rating[]).map((r) => (
          <button
            key={r}
            type="button"
            disabled={pending}
            onClick={() => onRate(r, comment)}
            className={`h-12 rounded-xl text-[15px] font-semibold disabled:opacity-60 ${initial === r ? "bg-accent text-white" : "bg-surface"}`}
          >
            {RATING_LABEL[r]}
          </button>
        ))}
      </div>
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Commentaire"
        aria-label="Commentaire"
        className="h-11 rounded-xl bg-surface px-3 text-[16px] outline-accent placeholder:text-faint"
      />
      {onLater && (
        <button type="button" onClick={onLater} disabled={pending} className="h-11 text-[15px] font-semibold text-muted">
          Plus tard
        </button>
      )}
    </div>
  );
}
