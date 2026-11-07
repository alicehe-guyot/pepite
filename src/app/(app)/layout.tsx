import { TabBar } from "@/components/TabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Mobile d'abord : iPhone 16 Pro (402 pt), marges de 16 pt, encoche gérée par safe-area. */}
      <main
        className="mx-auto max-w-[440px] px-4 pb-28"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}
      >
        {children}
      </main>
      <TabBar />
    </>
  );
}
