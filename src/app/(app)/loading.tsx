// Squelette affiché tout de suite au clic, pendant que la page se charge.
// Sans lui, les pages dynamiques ne sont pas préchargées et le clic semble ne rien faire.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Chargement" className="flex animate-pulse flex-col gap-4">
      <div className="h-9 w-40 rounded-xl bg-surface" />
      <div className="h-12 rounded-2xl bg-surface" />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-14 rounded-2xl bg-surface" />
      ))}
    </div>
  );
}
