import Link from "next/link";

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="-ml-1 flex h-11 w-fit items-center gap-1 text-[16px] font-semibold text-accent">
      <svg width="10" height="16" viewBox="0 0 10 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d="M8 2L2 8l6 6" />
      </svg>
      {children}
    </Link>
  );
}
