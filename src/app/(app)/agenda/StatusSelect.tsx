"use client";

import { useTransition } from "react";
import type { EventStatus } from "@/lib/agenda";
import { setEventStatus } from "./actions";

const LABEL = { todo: "Pas commencé", progress: "En cours", ready: "Prêt" } as const;

// Déplacer un événement à la main (#39). « Auto » : statut calculé à partir des cadeaux.
export function StatusSelect({ eventId, occurrence, status, auto }: { eventId: string; occurrence: string; status: EventStatus; auto: EventStatus }) {
  const [pending, start] = useTransition();
  if (auto === "past") return null;
  const manual = status !== auto;
  return (
    <label className="flex min-h-11 items-center gap-2 text-[14px] font-semibold text-muted">
      <span className="sr-only">Déplacer vers</span>
      <select
        value={manual ? status : "auto"}
        disabled={pending}
        onChange={(e) => {
          const v = e.target.value;
          start(() => setEventStatus(eventId, occurrence, v === "auto" ? null : (v as keyof typeof LABEL)));
        }}
        className="h-11 rounded-xl bg-surface px-3 text-[15px] font-semibold text-ink outline-accent disabled:opacity-60"
      >
        <option value="auto">Auto ({LABEL[auto]})</option>
        {(Object.keys(LABEL) as (keyof typeof LABEL)[]).map((k) => (
          <option key={k} value={k}>
            {LABEL[k]}
          </option>
        ))}
      </select>
    </label>
  );
}
