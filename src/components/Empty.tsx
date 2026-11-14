import { GiftMark } from "./Logo";

// État vide : un petit cadeau plutôt qu'une ligne grise seule.
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 rounded-2xl bg-surface px-3 py-3 text-[15px] text-muted">
      <GiftMark size={24} className="shrink-0 opacity-80" />
      {children}
    </p>
  );
}
