"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PersonStatus } from "@/lib/agenda";

const NEXT: Record<PersonStatus, PersonStatus> = { to_find: "lead", lead: "found", found: "given", given: "to_find" };

// Un tap fait avancer la personne : À trouver → Piste → Trouvé → Offert → À trouver.
export async function cycleStatus(eventId: string, personId: string, current: PersonStatus): Promise<void> {
  const supabase = await createClient();
  await supabase.from("event_persons").update({ status: NEXT[current] }).eq("event_id", eventId).eq("person_id", personId);
  revalidatePath("/agenda", "layout");
}
