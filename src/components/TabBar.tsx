"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 3 onglets, jamais plus (docs/SPEC.md §3).
export function TabBar() {
  const path = usePathname();
  const tab = (active: boolean) =>
    `flex h-[52px] w-24 flex-col items-center gap-1 text-xs font-semibold ${active ? "text-ink" : "text-[#7a7f86]"}`;

  return (
    <nav
      aria-label="Navigation"
      className="fixed inset-x-0 bottom-0 flex justify-around border-t border-line bg-bg pt-2.5"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
    >
      <Link href="/agenda" className={tab(path.startsWith("/agenda"))}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="15" rx="3" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
        Agenda
      </Link>
      <Link
        href="/capture"
        aria-label="Capturer une idée"
        className="-mt-1 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>
      <Link href="/carnet" className={tab(path.startsWith("/carnet"))}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z" />
          <path d="M5 17a3 3 0 0 1 3-3h11" />
        </svg>
        Carnet
      </Link>
    </nav>
  );
}
