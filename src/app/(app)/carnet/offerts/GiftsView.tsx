"use client";

import { useState } from "react";
import { FilterBar, syncUrl, type FilterSection } from "@/components/FilterBar";
import type { GivenGift } from "@/lib/gifts";
import type { WhoOption } from "../idees/IdeasView";
import { GiftList } from "./GiftList";
import { RATING_LABEL } from "./RatingPicker";

// Carnet > Offerts (#69) : filtres Pour qui, Note, Catégorie, comme pour les idées.
export function GiftsView({
  gifts,
  categories,
  who,
  initial,
  traits,
}: {
  gifts: GivenGift[];
  categories: string[];
  who: WhoOption[];
  initial: Record<string, string>;
  traits: Record<string, string[]>;
}) {
  const [f, setF] = useState(initial);
  const person = who.find((w) => w.key === f.qui);
  const shown = gifts.filter(
    (g) =>
      (!person || g.recipients.some((r) => (r.kind === "person" ? person.personIds : person.groupIds).includes(r.id))) &&
      (!f.note || (f.note === "a-noter" ? g.rating === null : g.rating === f.note)) &&
      (!f.cat || g.categories.includes(f.cat)) &&
      (!f.genre || traits[g.id]?.includes(f.genre)) &&
      (!f.age || traits[g.id]?.includes(f.age)),
  );
  const sections: FilterSection[] = [
    { key: "qui", label: "Pour qui", options: who.map((w) => ({ key: w.key, label: w.label })) },
    { key: "genre", label: "Femme ou homme", options: [{ key: "female", label: "Femme" }, { key: "male", label: "Homme" }] },
    { key: "age", label: "Adulte ou enfant", options: [{ key: "adult", label: "Adulte" }, { key: "child", label: "Enfant" }] },
    {
      key: "note",
      label: "Note",
      options: [...(Object.keys(RATING_LABEL) as (keyof typeof RATING_LABEL)[]).map((k) => ({ key: k, label: RATING_LABEL[k] })), { key: "a-noter", label: "À noter" }],
    },
    { key: "cat", label: "Catégorie", options: categories.map((c) => ({ key: c, label: c })), manage: { href: "/carnet/categories", label: "Modifier" } },
  ];
  return (
    <>
      <FilterBar
        sections={sections}
        value={f}
        count={shown.length}
        onChange={(next) => {
          setF(next);
          syncUrl("offerts", next);
        }}
      />
      <GiftList gifts={shown} categories={categories} />
    </>
  );
}
