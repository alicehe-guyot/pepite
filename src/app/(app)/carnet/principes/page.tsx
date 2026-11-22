import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import { myPrinciples } from "@/lib/brief";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { PrinciplesForm } from "./PrinciplesForm";

// Nom du compte connecté (Alice ou JB), pour savoir dans quel compte on est.
async function accountName(): Promise<string | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const uid = auth?.claims.sub;
  if (!uid) return null;
  const { data } = await supabase.from("users").select("display_name").eq("id", uid).maybeSingle();
  return data?.display_name ?? null;
}

// Réglages (dans le Carnet, pas de 4e onglet) : mes principes, les catégories, l'export, le compte.
export default async function SettingsPage() {
  const [principles, account] = await Promise.all([myPrinciples(), accountName()]);
  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/carnet">Carnet</BackLink>
      <h1 className="text-[24px] font-bold">Réglages</h1>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-bold">Mes principes</h2>
        <PrinciplesForm value={principles ?? ""} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-bold">Catégories</h2>
        <Link href="/carnet/categories" className="flex min-h-11 w-fit items-center rounded-xl bg-surface px-4 text-[15px] font-semibold">
          Modifier les catégories
        </Link>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-bold">Mes données</h2>
        <p className="text-[15px] text-muted md:max-w-2xl">
          Une archive avec un fichier par table (fiches, groupes, idées, cadeaux, notes, événements), lisible dans Excel ou Numbers.
        </p>
        <a href="/api/export" download className="flex h-12 w-fit items-center rounded-2xl bg-accent px-5 text-[16px] font-semibold text-white">
          Tout exporter
        </a>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-bold">Compte</h2>
        {account && <p className="text-[15px] text-muted">Connecté en tant que {account}</p>}
        <form action={signOut}>
          <button type="submit" className="flex h-12 w-fit items-center rounded-2xl bg-surface px-5 text-[16px] font-semibold text-accent">
            Se déconnecter
          </button>
        </form>
      </section>
    </div>
  );
}
