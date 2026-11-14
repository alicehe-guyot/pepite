import "server-only";
import { createClient } from "@/lib/supabase/server";

// Portrait : 5 rubriques identiques pour tous (SPEC §8.10).
export const RUBRICS = [
  { key: "situation", label: "Situation" },
  { key: "passions", label: "Passions" },
  { key: "style", label: "Style" },
  { key: "avoid", label: "À éviter" },
  { key: "wishes", label: "Envies" },
] as const;
export type RubricKey = (typeof RUBRICS)[number]["key"];

export type PersonSummary = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  birth_year: number | null;
  birth_month: number | null;
  birth_day: number | null;
  gender: "female" | "male" | null;
  age_group: "adult" | "child" | null;
};

// Femme ou homme, adulte ou enfant (#76).
export const TRAITS = { female: "Femme", male: "Homme", adult: "Adulte", child: "Enfant" } as const;
export type Trait = keyof typeof TRAITS;

// Traits couverts par des destinataires : les personnes, et les membres des groupes.
export function traitsOf(
  recipients: { kind: "person" | "group"; id: string }[],
  persons: Pick<PersonSummary, "id" | "gender" | "age_group">[],
  groups: { id: string; members: { id: string }[] }[],
): Trait[] {
  const ids = new Set(recipients.flatMap((r) => (r.kind === "person" ? [r.id] : (groups.find((g) => g.id === r.id)?.members.map((m) => m.id) ?? []))));
  const out = new Set<Trait>();
  for (const p of persons) if (ids.has(p.id)) [p.gender, p.age_group].forEach((t) => t && out.add(t));
  return [...out];
}

export type Person = PersonSummary &
  Record<RubricKey, string | null> & {
    description: string | null;
    budget_max: number | null;
    groups: { id: string; slug: string; name: string }[];
  };

// Âge calculé, jamais saisi. Null si l'année est inconnue.
export function age(p: Pick<PersonSummary, "birth_year" | "birth_month" | "birth_day">, today = new Date()): number | null {
  if (!p.birth_year) return null;
  let a = today.getFullYear() - p.birth_year;
  const m = p.birth_month ?? 1;
  const d = p.birth_day ?? 1;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) a--;
  return a;
}

export function ageLabel(p: Parameters<typeof age>[0]): string | null {
  const a = age(p);
  if (a === null) return null;
  if (a < 1) return "Bébé";
  return `${a} ans`;
}

export const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

// « 2 juillet », « juillet » si le jour manque, null si le mois manque.
export function birthdayLabel(p: Pick<PersonSummary, "birth_month" | "birth_day">): string | null {
  if (!p.birth_month) return null;
  const month = MONTHS[p.birth_month - 1];
  return p.birth_day ? `${p.birth_day === 1 ? "1er" : p.birth_day} ${month}` : month;
}

const SUMMARY = "id, slug, name, city, birth_year, birth_month, birth_day, gender, age_group";

export async function listPersons(): Promise<PersonSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("persons").select(SUMMARY).order("name").returns<PersonSummary[]>();
  if (error) throw error;
  return (data ?? []).sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export async function getPerson(slug: string): Promise<Person | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("persons")
    .select(
      `${SUMMARY}, description, budget_max, situation, passions, style, avoid, wishes,
       group_members(groups(id, slug, name))`,
    )
    .eq("slug", slug)
    .maybeSingle<
      Omit<Person, "groups"> & {
        group_members: { groups: { id: string; slug: string; name: string } | null }[];
      }
    >();
  if (error) throw error;
  if (!data) return null;
  const { group_members, ...person } = data;
  return {
    ...person,
    groups: group_members.flatMap((g) => (g.groups ? [g.groups] : [])),
  };
}
