import { GiftMark } from "./Logo";

// Titre des 3 onglets, avec le petit cadeau (DA #68).
export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="flex items-center gap-2 text-[26px] font-bold leading-tight">
      <GiftMark size={30} className="-ml-1 shrink-0" />
      {children}
    </h1>
  );
}
