import { BackLink } from "@/components/BackLink";
import { listCategories } from "@/lib/categories";
import { listGivenGifts } from "@/lib/gifts";
import { listIdeas } from "@/lib/ideas";
import { CategoriesForm } from "./CategoriesForm";

// Catégories (#69) : ajouter, supprimer ; le nombre d'idées et de cadeaux qui les utilisent.
export default async function CategoriesPage() {
  const [categories, ideas, gifts] = await Promise.all([listCategories(), listIdeas(), listGivenGifts()]);
  const count = (c: string) => ideas.filter((i) => i.categories.includes(c)).length + gifts.filter((g) => g.categories.includes(c)).length;
  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/carnet?vue=idees">Idées</BackLink>
      <h1 className="text-[26px] font-bold">Catégories</h1>
      <CategoriesForm categories={categories.map((c) => ({ name: c, count: count(c) }))} />
    </div>
  );
}
