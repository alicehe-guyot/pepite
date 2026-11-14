import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import { myPrinciples } from "@/lib/brief";
import { PrinciplesForm } from "./PrinciplesForm";

// Réglages (dans le Carnet, pas de 4e onglet) : mes principes, les catégories, l'export.
export default async function SettingsPage() {
  const principles = await myPrinciples();
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
    </div>
  );
}
