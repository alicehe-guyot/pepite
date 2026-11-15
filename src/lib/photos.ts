import "server-only";
import { createClient } from "@/lib/supabase/server";

// Liens temporaires (1 h) vers les photos du bucket privé « photos » (#88). La RLS du stockage
// applique le secret : une photo d'idée invisible ne reçoit pas de lien.
export async function signPhotos(paths: (string | null | undefined)[]): Promise<Record<string, string>> {
  const list = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  if (!list.length) return {};
  const supabase = await createClient();
  const { data } = await supabase.storage.from("photos").createSignedUrls(list, 3600);
  return Object.fromEntries((data ?? []).flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl]] : [])));
}
