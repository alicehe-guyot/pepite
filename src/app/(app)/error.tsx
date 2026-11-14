"use client";

// Erreur inattendue (souvent : l'app a été mise à jour pendant qu'elle était ouverte).
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col gap-4 pt-10">
      <h1 className="text-[24px] font-bold">Petit souci</h1>
      <p className="text-[16px] text-muted">L&apos;app a sans doute été mise à jour. Recharge, puis refais ta dernière action.</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => window.location.reload()} className="h-12 flex-1 rounded-2xl bg-accent text-[17px] font-semibold text-white md:w-fit md:flex-none md:px-6">
          Recharger
        </button>
        <button type="button" onClick={reset} className="h-12 rounded-2xl px-4 text-[16px] font-semibold text-muted">
          Réessayer
        </button>
      </div>
    </div>
  );
}
