// Import initial des notes d'Alice (SPEC US-N7) dans Supabase.
// Usage : node --env-file=.env.local scripts/import-seed.mjs [supabase/seed/import.json]
// Utilise la clé service role (contourne la RLS) : à lancer en local uniquement.
// Refuse de tourner si la base contient déjà des fiches.
//
// Choix de correspondance (validés par Alice le 2026-11-07) :
// - groupes importés en groupes transverses, à ranger ensuite en cercles et foyers ;
// - notation loved → wow, ok → worked ;
// - collections → catégorie d'idée (la première).

import { readFileSync } from "node:fs";

const file = process.argv[2] ?? "supabase/seed/import.json";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis");

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function rest(method, path, body) {
  const res = await fetch(`${url}/rest/v1/${path}`, { method, headers, body: body && JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}
const insert = (table, rows) => (rows.length ? rest("POST", table, rows) : []);

const RATING = { loved: "wow", ok: "worked", miss: "miss" };
const seed = JSON.parse(readFileSync(file, "utf8"));

if ((await rest("GET", "persons?select=id&limit=1")).length) {
  throw new Error("La base contient déjà des fiches : import annulé.");
}

// Comptes déjà inscrits, retrouvés par leur slug (alice, jb) via public.users.
const accounts = await rest("GET", "users?select=id,email,display_name");
const accountBySlug = Object.fromEntries(
  accounts.map((a) => [a.display_name.toLowerCase(), a.id]),
);
const creator = accountBySlug.alice ?? null;

// Fiches
const persons = await insert(
  "persons",
  seed.persons.map((p) => ({
    slug: p.id,
    name: p.name,
    description: p.description ?? null,
    city: p.city ?? null,
    country: p.country ?? null,
    life_stage_tags: p.life_stage_tags ?? [],
    preferences: p.preferences ?? [],
    birth_year: p.birth_year ?? null,
    birth_month: p.birth_month ?? null,
    birth_day: p.birth_day ?? null,
    birth_date_uncertain: p.birth_date_uncertain ?? false,
    created_by: creator,
  })),
);
const personId = Object.fromEntries(persons.map((p) => [p.slug, p.id]));

// Groupes
const groups = await insert(
  "groups",
  seed.groups.map((g) => ({ slug: g.id, name: g.name, kind: "transverse", type: g.type, created_by: creator })),
);
const groupId = Object.fromEntries(groups.map((g) => [g.slug, g.id]));
await insert(
  "group_members",
  seed.groups.flatMap((g) => g.members.map((m) => ({ group_id: groupId[g.id], person_id: personId[m] }))),
);

// Événements et avancement
const events = await insert(
  "events",
  seed.events.map((e) => ({
    slug: e.id,
    type: e.type,
    title: e.title,
    date: e.date,
    recurrence: e.recurrence ?? "none",
    person_id: e.type === "birthday" && e.persons.length === 1 ? personId[e.persons[0].person] : null,
    created_by: creator,
  })),
);
const eventId = Object.fromEntries(events.map((e) => [e.slug, e.id]));
await insert(
  "event_persons",
  seed.events.flatMap((e) =>
    e.persons.map((p) => ({ event_id: eventId[e.id], person_id: personId[p.person], status: p.status ?? "to_find" })),
  ),
);

// Idées
const ideas = await insert(
  "ideas",
  seed.ideas.map((i) => ({
    slug: i.id,
    title: i.title,
    url: i.url ?? null,
    source: "import",
    category: i.collections?.[0] ?? null,
    format: i.format ?? null,
    note: i.note ?? null,
    status: i.status ?? "inbox",
    is_reusable: i.is_reusable ?? false,
    created_by: creator,
  })),
);
const ideaId = Object.fromEntries(ideas.map((i) => [i.slug, i.id]));
await insert(
  "idea_recipients",
  seed.ideas.flatMap((i) => [
    ...i.persons.map((p) => ({ idea_id: ideaId[i.id], person_id: personId[p], group_id: null })),
    ...(i.groups ?? []).map((g) => ({ idea_id: ideaId[i.id], person_id: null, group_id: groupId[g] })),
  ]),
);

// Cadeaux (un par un pour garder le lien avec destinataires, offreurs et notation)
let gifts = 0;
for (const g of seed.gifts) {
  const [gift] = await insert("gifts", [
    {
      idea_id: g.idea_id ? ideaId[g.idea_id] : null,
      event_id: g.event ? eventId[g.event] : null,
      event_label: g.event_label ?? null,
      title: g.title,
      format: g.format ?? null,
      status: g.status,
      note: g.note ?? null,
      received: g.received ?? false,
      requested_by_recipient: g.requested_by_recipient ?? false,
      visible_to_recipient_users: g.visible_to_recipient_users ?? false,
      created_by: creator,
    },
  ]);
  await insert("gift_recipients", [
    ...g.persons.map((p) => ({ gift_id: gift.id, person_id: personId[p], group_id: null })),
    ...(g.groups ?? []).map((gr) => ({ gift_id: gift.id, person_id: null, group_id: groupId[gr] })),
  ]);
  await insert(
    "gift_givers",
    (g.givers_free_text ?? []).map((t) => ({ gift_id: gift.id, free_text: t })),
  );
  if (g.feedback?.rating) {
    await insert("gift_feedback", [
      { gift_id: gift.id, rating: RATING[g.feedback.rating], comment: g.feedback.comment ?? null, rated_by: creator },
    ]);
  }
  gifts++;
}

// Comptes ↔ fiches, réglages
const linked = [];
for (const u of seed.users) {
  const account = accountBySlug[u.id];
  if (!account) continue;
  await rest("PATCH", `users?id=eq.${account}`, { person_id: personId[u.person_id] });
  linked.push(u.id);
}
if (creator && seed.settings) {
  await insert("settings", [
    {
      user_id: creator,
      gift_principles: (seed.settings.gift_principles ?? []).join("\n"),
      inspiration_links: seed.settings.inspiration_links ?? [],
    },
  ]);
}

console.log(
  JSON.stringify({
    persons: persons.length,
    groups: groups.length,
    events: events.length,
    ideas: ideas.length,
    gifts,
    accounts_linked: linked,
    accounts_missing: seed.users.map((u) => u.id).filter((id) => !linked.includes(id)),
  }),
);
