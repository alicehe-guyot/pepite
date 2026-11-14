import { BackLink } from "@/components/BackLink";
import { myPrinciples } from "@/lib/brief";
import { PrinciplesForm } from "./PrinciplesForm";

// Mes principes : repris dans chaque brief Instinct.
export default async function PrinciplesPage() {
  const principles = await myPrinciples();
  return (
    <div className="flex flex-col gap-5">
      <BackLink href="/carnet">Carnet</BackLink>
      <h1 className="text-[24px] font-bold">Mes principes</h1>
      <PrinciplesForm value={principles ?? ""} />
    </div>
  );
}
