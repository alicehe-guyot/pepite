import { TabBar } from "@/components/TabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Mobile d'abord : iPhone 16 Pro (402 pt), marges de 16 pt, encoche gérée par safe-area.
          Ordinateur (md+) : barre de navigation à gauche, contenu plus large. */}
      <main
        className="mx-auto max-w-[440px] px-4 pb-28 md:ml-56 md:mr-0 md:max-w-[1040px] md:px-10 md:pb-16"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}
      >
        {children}
      </main>
      <TabBar />
    </>
  );
}
