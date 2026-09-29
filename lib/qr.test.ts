import { describe, expect, it } from "vitest";
import {
  blankCardUrl,
  checkReviewLink,
  generateCardId,
  isValidCardId,
} from "./qr";

describe("generateCardId", () => {
  it("berformat G-XXXX", () => {
    expect(generateCardId()).toMatch(/^G-.{4}$/);
  });

  it("tidak memakai huruf rancu I, L, O", () => {
    for (let i = 0; i < 200; i += 1) {
      const id = generateCardId();
      expect(isValidCardId(id)).toBe(true);
      expect(id).not.toMatch(/[ILO]/);
    }
  });

  it("unik per panggilan (sampel 50)", () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateCardId()));
    expect(ids.size).toBe(50);
  });

  it("mendukung injeksi random untuk determinisme", () => {
    expect(generateCardId(() => 0)).toBe("G-0000");
  });
});

describe("isValidCardId", () => {
  it("menerima contoh referensi G-0NUJ", () => {
    expect(isValidCardId("G-0NUJ")).toBe(true);
  });

  it("menolak format salah", () => {
    expect(isValidCardId("0NUJ")).toBe(false);
    expect(isValidCardId("G-0NUI")).toBe(false);
    expect(isValidCardId("G-TOOLONG")).toBe(false);
    expect(isValidCardId("")).toBe(false);
  });
});

describe("checkReviewLink", () => {
  it("mendeteksi link Google + hint form bintang 5", () => {
    const r = checkReviewLink(
      "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG8",
    );
    expect(r.ok).toBe(true);
    expect(r.source).toBe("google");
    expect(r.hint).toContain("bintang 5");
  });

  it("mendeteksi link TripAdvisor", () => {
    const r = checkReviewLink("https://www.tripadvisor.com/Hotel_Review-g1");
    expect(r.ok).toBe(true);
    expect(r.source).toBe("tripadvisor");
  });

  it("menerima link lain sebagai other (paste bebas)", () => {
    const r = checkReviewLink("https://example.com/review");
    expect(r.ok).toBe(true);
    expect(r.source).toBe("other");
  });

  it("trim spasi dan menolak string kosong / bukan URL", () => {
    expect(checkReviewLink("   ").ok).toBe(false);
    expect(checkReviewLink("bukan-url").ok).toBe(false);
    const r = checkReviewLink("  https://google.com/maps  ");
    expect(r.url).toBe("https://google.com/maps");
  });
});

describe("blankCardUrl", () => {
  it("membentuk pola /r/G-XXXX", () => {
    expect(blankCardUrl("https://app.example", "G-0NUJ")).toBe(
      "https://app.example/r/G-0NUJ",
    );
  });

  it("tahan trailing slash ganda", () => {
    expect(blankCardUrl("https://app.example///", "G-0NUJ")).toBe(
      "https://app.example/r/G-0NUJ",
    );
  });
});
