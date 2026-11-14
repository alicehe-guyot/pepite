"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleMember } from "../../actions";

type P = { id: string; slug: string; name: string };

// Membres d'un groupe : liens vers les fiches ; « Modifier » pour cocher ou décocher des personnes (#77).
export function Members({ groupId, members, everyone }: { groupId: string; members: P[]; everyone: P[] }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const ids = new Set(members.map((m) => m.id));
  const chip = "flex min-h-11 items-center rounded-full px-3.5 text-[14px] font-semibold";

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-2">
        {editing
          ? everyone.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={pending}
                  aria-pressed={ids.has(p.id)}
                  onClick={() => start(() => toggleMember(groupId, p.id, ids.has(p.id)))}
                  className={`${chip} ${ids.has(p.id) ? "bg-accent text-white" : "bg-surface"}`}
                >
                  {p.name}
                </button>
              </li>
            ))
          : members.map((m) => (
              <li key={m.id}>
                <Link href={`/carnet/${m.slug}`} className={`${chip} bg-surface`}>
                  {m.name}
                </Link>
              </li>
            ))}
        <li>
          <button type="button" onClick={() => setEditing(!editing)} className={`${chip} text-accent`}>
            {editing ? "Terminé" : "Modifier"}
          </button>
        </li>
      </ul>
    </div>
  );
}
