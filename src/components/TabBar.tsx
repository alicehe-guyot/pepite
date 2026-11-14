"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GiftMark } from "./Logo";

// 3 onglets, jamais plus (docs/SPEC.md §3).
// iPhone : barre en bas. Ordinateur (md+) : colonne à gauche, mêmes 3 entrées.
export function TabBar() {
  const path = usePathname();
  const tab = (active: boolean) =>
    `flex h-[52px] w-24 flex-col items-center gap-1 text-xs font-semibold md:h-11 md:w-full md:flex-row md:gap-3 md:rounded-xl md:px-3 md:text-[15px] ${
      active ? "text-accent md:bg-accent-soft" : "text-[#7a7f86] md:hover:bg-surface"
    }`;

  return (
    <nav
      aria-label="Navigation"
      className="fixed inset-x-0 bottom-0 flex justify-around border-t border-line bg-bg pt-2.5 md:inset-x-auto md:top-0 md:left-0 md:w-56 md:flex-col md:justify-start md:gap-1 md:border-t-0 md:border-r md:px-3 md:pt-6"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
    >
      <span className="hidden items-center gap-2 px-2 pb-4 font-display text-2xl font-bold md:flex">
        <GiftMark size={34} />
        Pépite
      </span>
      <Link href="/agenda" className={`${tab(path.startsWith("/agenda"))} md:order-2`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="15" rx="3" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
        Agenda
      </Link>
      <Link
        href="/capture"
        aria-label="Capturer une idée"
        className="-mt-1 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_4px_14px_rgba(194,37,92,0.35)] md:order-1 md:mt-0 md:mb-3 md:h-11 md:w-full md:justify-start md:gap-3 md:rounded-xl md:px-3 md:text-[15px] md:font-semibold"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" className="md:h-5 md:w-5">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span className="hidden md:inline">Nouvelle idée</span>
      </Link>
      <Link href="/carnet" className={`${tab(path.startsWith("/carnet"))} md:order-3`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z" />
          <path d="M5 17a3 3 0 0 1 3-3h11" />
        </svg>
        Carnet
      </Link>
    </nav>
  );
}
