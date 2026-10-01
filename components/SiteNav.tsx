// Navigasi global: brand + pintasan /cards, sticky agar selalu terjangkau.
// Sticky solid bg-paper (tanpa blur) supaya konten bawah tak mengintip.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function SiteNav() {
  const pathname = usePathname();
  const onCards = pathname === "/cards" || pathname.startsWith("/cards/");
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-paper">
      <nav
        aria-label="Navigasi utama"
        className="mx-auto flex min-h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6"
      >
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className="rounded-full py-2 text-sm font-semibold tracking-tight text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
        >
          StaticCred
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/cards"
            aria-current={onCards ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none ${
              onCards
                ? "bg-ink text-paper"
                : "text-deep-gray hover:bg-surface-alt hover:text-ink"
            }`}
          >
            Daftar Kartu
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
