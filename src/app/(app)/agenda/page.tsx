export default function AgendaPage() {
  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-[32px] font-bold">Agenda</h1>
      <div className="flex flex-col gap-3.5 rounded-[20px] bg-sun p-5">
        <div className="flex items-baseline justify-between text-xl font-bold">
          <span>Noël 2026</span>
        </div>
        <div className="h-2 overflow-hidden rounded bg-white" />
      </div>
    </div>
  );
}
