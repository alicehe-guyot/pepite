import { createClient } from "@/lib/supabase/server";
import { zip } from "@/lib/zip";

// « Tout exporter » (SPEC §8.9, #79) : un CSV par table dans une archive ZIP.
// Lu avec la session de la personne connectée : la RLS s'applique, le secret est respecté
// (JB n'exportera jamais ses propres cadeaux).
const TABLES = [
  "persons",
  "groups",
  "group_members",
  "categories",
  "ideas",
  "idea_recipients",
  "events",
  "event_persons",
  "gifts",
  "gift_recipients",
  "gift_givers",
  "gift_feedback",
  "settings",
] as const;

function csv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const cell = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // BOM pour qu'Excel et Numbers lisent bien les accents.
  return "﻿" + [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
}

export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return new Response("Non connecté", { status: 401 });

  const files: { name: string; content: string }[] = [];
  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) return new Response(`Export impossible (${table})`, { status: 500 });
    files.push({ name: `${table}.csv`, content: csv(data ?? []) });
  }
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
  files.unshift({
    name: "LISEZMOI.txt",
    content: [
      `Export Pépite du ${day}.`,
      "Un fichier CSV par table (séparateur virgule, UTF-8), lisible dans Excel, Numbers ou Google Sheets.",
      "persons : fiches. groups, group_members : groupes et leurs membres.",
      "ideas, idea_recipients : idées et pour qui. gifts, gift_recipients, gift_feedback : cadeaux, destinataires, notes.",
      "events, event_persons : événements et personnes concernées. categories, settings : catégories et principes.",
      "Les liens entre fichiers se font par les colonnes id (ex. idea_recipients.idea_id = ideas.id).",
    ].join("\n"),
  });
  return new Response(zip(files) as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="pepite-${day}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
