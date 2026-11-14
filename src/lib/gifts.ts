import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Rating = "wow" | "worked" | "miss";

export type GivenGift = {
  id: string;
  title: string;
  occasion: string | null; // événement ou libellé importé
  year: number | null; // année de l'événement, si connue
  givenOn: string | null; // date offerte (AAAA-MM-JJ), si connue
  categories: string[]; // les siennes, plus celles de l'idée d'origine
  rating: Rating | null; // null : à noter
  comment: string | null;
  recipients: { kind: "person" | "group"; id: string; name: string }[];
};

type Row = {
  id: string;
  title: string;
  event_label: string | null;
  given_on: string | null;
  categories: string[];
  ideas: { categories: string[] } | null;
  events: { title: string; date: string; recurrence: string } | null;
  gift_feedback: { rating: Rating; comment: string | null } | null;
  gift_recipients: { persons: { id: string; name: string } | null; groups: { id: string; name: string } | null }[];
};

// Cadeaux offerts (SPEC §8.7, §8.10 : Carnet > Offerts). « À noter » d'abord, puis les plus récents.
export async function listGivenGifts(): Promise<GivenGift[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gifts")
    .select(
      "id, title, event_label, given_on, categories, ideas(categories), created_at, events(title, date, recurrence), gift_feedback(rating, comment), gift_recipients(persons(id, name), groups(id, name))",
    )
    .eq("status", "given")
    .order("created_at", { ascending: false })
    .returns<Row[]>();
  if (error) throw error;
  return (data ?? [])
    .map((g) => ({
      id: g.id,
      title: g.title,
      occasion: g.events?.title ?? g.event_label,
      year: g.events && g.events.recurrence === "none" ? Number(g.events.date.slice(0, 4)) : null,
      givenOn: g.given_on,
      categories: [...new Set([...g.categories, ...(g.ideas?.categories ?? [])])],
      rating: g.gift_feedback?.rating ?? null,
      comment: g.gift_feedback?.comment ?? null,
      recipients: g.gift_recipients.flatMap((r): GivenGift["recipients"] =>
        r.persons ? [{ kind: "person", ...r.persons }] : r.groups ? [{ kind: "group", ...r.groups }] : [],
      ),
    }))
    .sort((a, b) => Number(a.rating !== null) - Number(b.rating !== null));
}

// Cadeaux offerts à une personne, directement ou via un de ses groupes.
export function giftsFor(gifts: GivenGift[], personId: string, groupIds: string[]): GivenGift[] {
  return gifts.filter((g) => g.recipients.some((r) => (r.kind === "person" ? r.id === personId : groupIds.includes(r.id))));
}
