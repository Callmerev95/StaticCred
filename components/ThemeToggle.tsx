"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

// Toggle Tema Aplikasi di header. Mounted via store agar tanpa effect.
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const dark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-pressed={dark}
      aria-label={dark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      title={dark ? "Tema terang" : "Tema gelap"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-hairline bg-paper text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
    >
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        )}
      </svg>
    </button>
  );
}
