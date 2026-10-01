import { describe, expect, it } from "vitest";
import { SITE_NAME, siteUrl } from "./site";

describe("site", () => {
  it("siteUrl memakai NEXT_PUBLIC_APP_URL tanpa trailing slash", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://contoh.app///";
    expect(siteUrl()).toBe("https://contoh.app");
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("siteUrl punya fallback saat env kosong", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    expect(siteUrl()).toBe("https://cards.callmerev.my.id");
  });

  it("nama situs konsisten", () => {
    expect(SITE_NAME).toBe("StaticCred");
  });
});
