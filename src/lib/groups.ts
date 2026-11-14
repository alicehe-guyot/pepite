import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Member = { id: string; slug: string; name: string; sizes: string | null };
export type Group = { id: string; slug: string; name: string; members: Member[] };

type GroupRow = Omit<Group, "members"> & { group_members: { persons: Member | null }[] };

const SELECT = "id, slug, name, group_members(persons(id, slug, name, sizes))";

function toGroup({ group_members, ...g }: GroupRow): Group {
  const members = group_members.flatMap((m) => (m.persons ? [m.persons] : []));
  members.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return { ...g, members };
}

export async function listGroups(): Promise<Group[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("groups").select(SELECT).returns<GroupRow[]>();
  if (error) throw error;
  return (data ?? []).map(toGroup).sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export async function getGroup(slug: string): Promise<Group | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("groups").select(SELECT).eq("slug", slug).maybeSingle<GroupRow>();
  if (error) throw error;
  return data ? toGroup(data) : null;
}
