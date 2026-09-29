"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";

// Tema Aplikasi saja (chrome). Piksel cetak tidak membaca tema ini (ADR-0004).
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
