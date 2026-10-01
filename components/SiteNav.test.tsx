// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import SiteNav from "./SiteNav";

let mockTheme = "light";
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useTheme: () => ({ resolvedTheme: mockTheme, setTheme: () => {} }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPath,
}));

let mockPath = "/";

describe("SiteNav", () => {
  it("brand ke /, pintasan /cards, satu toggle tema", () => {
    mockPath = "/";
    mockTheme = "light";
    render(<SiteNav />);
    expect(screen.getByRole("link", { name: "StaticCred" })).toHaveProperty(
      "href",
      expect.stringContaining("/"),
    );
    expect(screen.getByRole("link", { name: "Daftar Kartu" })).toHaveProperty(
      "href",
      expect.stringContaining("/cards"),
    );
    expect(
      screen.getByRole("button", { name: "Ganti ke tema gelap" }),
    ).toBeDefined();
    expect(screen.getByRole("navigation")).toBeDefined();
  });

  it("penanda halaman aktif berpindah ke /cards", () => {
    mockPath = "/cards";
    render(<SiteNav />);
    expect(
      screen.getByRole("link", { name: "Daftar Kartu" }).getAttribute(
        "aria-current",
      ),
    ).toBe("page");
  });

  it("sticky di atas konten", () => {
    mockPath = "/";
    const { container } = render(<SiteNav />);
    expect(container.querySelector("header")?.className).toContain("sticky");
  });
});
