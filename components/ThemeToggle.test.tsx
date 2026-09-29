// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import ThemeProvider from "./ThemeProvider";
import ThemeToggle from "./ThemeToggle";

// next-themes membaca process.env saat modul dimuat yang tidak stabil di
// jsdom vitest. Logika toggle diuji di sini, integrasi provider dibuktikan
// lewat live check browser.
let mockTheme = "light";
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useTheme: () => ({
    resolvedTheme: mockTheme,
    setTheme: (t: string) => {
      mockTheme = t;
    },
  }),
}));

function Harness() {
  return (
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}

describe("ThemeToggle", () => {
  it("beralih terang ke gelap dan sebaliknya", () => {
    mockTheme = "light";
    const view = render(<Harness />);
    fireEvent.click(
      screen.getByRole("button", { name: "Ganti ke tema gelap" }),
    );
    view.rerender(<Harness />);
    expect(
      screen.getByRole("button", { name: "Ganti ke tema terang" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Ganti ke tema terang" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
  });
});
