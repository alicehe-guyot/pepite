# Pépite

Offrir sans corvée, recevoir sans déception. Carnet de cadeaux familial, iPhone et Mac (PWA).

Spec complète : [`docs/SPEC.md`](docs/SPEC.md). Règles pour l'agent de dev : [`CLAUDE.md`](CLAUDE.md).

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # puis remplir l'URL et l'anon key Supabase
npm run dev                  # http://localhost:3000
```

## Base de données

```bash
npx supabase start              # Supabase local (Docker), applique supabase/migrations
npx supabase test db            # tests du secret (supabase/tests)
npx supabase db push            # applique les migrations au projet distant (après supabase link)
```

## Stack

Next.js 16 (App Router, TypeScript, Tailwind 4) · Supabase (Postgres, Auth par lien magique, RLS) · Vercel.

## Structure

```
src/app/(app)/   écrans derrière connexion : agenda, carnet, capture
src/app/login/   connexion par lien magique
src/components/  composants partagés (TabBar…)
src/lib/         clients Supabase, logique métier
src/proxy.ts     rafraîchit la session, renvoie vers /login
supabase/        migrations SQL, tests RLS (pgTAP), seed (hors git)
docs/SPEC.md     source de vérité produit
```
