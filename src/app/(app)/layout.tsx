import { TabBar } from "@/components/TabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mx-auto max-w-xl px-5 pb-32 pt-14">{children}</main>
      <TabBar />
    </>
  );
}
