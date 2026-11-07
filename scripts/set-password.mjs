// Crée un compte Pépite ou change son mot de passe. Pas d'email : le compte s'appelle
// <prénom>@pepite.local (voir src/app/login/actions.ts) et aucun email n'est envoyé.
// Le mot de passe est tapé ici, masqué, et n'est jamais écrit dans un fichier.
// Chaque personne doit avoir un mot de passe différent : c'est lui qui dit qui entre.
// Usage : node --env-file=.env.local scripts/set-password.mjs <prénom> <Nom affiché>
// Exemple : node --env-file=.env.local scripts/set-password.mjs jb JB
// Le compte est lié à la fiche de même slug (alice, jb) si elle existe.

import readline from "node:readline";

const [account, displayName] = process.argv.slice(2);
if (!account || !displayName) {
  console.error("Usage : node --env-file=.env.local scripts/set-password.mjs <prénom> <Nom affiché>");
  process.exit(1);
}
const email = `${account.toLowerCase()}@pepite.local`;
const personSlug = account.toLowerCase();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis");
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

async function call(method, path, body) {
  const res = await fetch(`${url}${path}`, { method, headers: { ...headers, Prefer: "return=representation" }, body: body && JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
let prompting = "";
rl._writeToOutput = (s) => { if (s === prompting || !process.stdin.isTTY) rl.output.write(s); };
const lines = rl[Symbol.asyncIterator]();
async function askHidden(question) {
  prompting = question;
  rl.output.write(question);
  const { value } = await lines.next();
  rl.output.write("\n");
  return value ?? "";
}

const password = await askHidden("Mot de passe : ");
const confirm = await askHidden("Encore une fois : ");
rl.close();
if (password.length < 8) throw new Error("8 caractères minimum");
if (confirm !== password) throw new Error("Les deux saisies diffèrent");

// Compte Auth : créé s'il n'existe pas, sinon mot de passe remplacé.
const { users } = await call("GET", "/auth/v1/admin/users?per_page=1000");
let user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (user) {
  await call("PUT", `/auth/v1/admin/users/${user.id}`, { password, email_confirm: true });
} else {
  user = await call("POST", "/auth/v1/admin/users", { email, password, email_confirm: true });
}

// Accès aux données (public.users) et lien vers sa fiche.
const [person] = await call("GET", `/rest/v1/persons?slug=eq.${encodeURIComponent(personSlug)}&select=id`);
const personId = person?.id ?? null;
const row = { id: user.id, email, display_name: displayName, ...(personId && { person_id: personId }) };
await fetch(`${url}/rest/v1/users?on_conflict=id`, {
  method: "POST",
  headers: { ...headers, Prefer: "resolution=merge-duplicates" },
  body: JSON.stringify(row),
}).then(async (r) => { if (!r.ok) throw new Error(await r.text()); });

console.log(`Compte prêt : ${displayName}${personId ? `, lié à la fiche ${personSlug}` : ", sans fiche liée"}`);
