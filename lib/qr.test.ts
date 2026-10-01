import { describe, expect, it } from "vitest";
import {
  activateUrl,
  blankCardUrl,
  checkReviewLink,
  generateCardId,
  isGoogleReviewLink,
  isValidCardId,
} from "./qr";

describe("generateCardId", () => {
  it("berformat G-XXXXXX (6 karakter)", () => {
    expect(generateCardId()).toMatch(/^G-.{6}$/);
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
    expect(generateCardId(() => 0)).toBe("G-000000");
  });
});

describe("isValidCardId", () => {
  it("menerima format 6 karakter", () => {
    expect(isValidCardId("G-0NUJXA")).toBe(true);
  });

  it("menolak format salah", () => {
    expect(isValidCardId("0NUJX")).toBe(false);
    expect(isValidCardId("G-0NUIXA")).toBe(false);
    expect(isValidCardId("G-0NUJ")).toBe(false);
    expect(isValidCardId("G-TOOLONG")).toBe(false);
    expect(isValidCardId("")).toBe(false);
  });
});

describe("checkReviewLink", () => {
  it("mendeteksi link Google + hint tujuan tulis ulasan", () => {
    const r = checkReviewLink(
      "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG8",
    );
    expect(r.ok).toBe(true);
    expect(r.source).toBe("google");
    expect(r.hint).toContain("tulis ulasan Google Search");
  });

  it("hint jujur saat Google link tanpa place ID", () => {
    const r = checkReviewLink(
      "https://www.google.com/maps/place/Kopi/@-6.2,106.8,17z/data=!4m2!3d1!4d2",
    );
    expect(r.ok).toBe(true);
    expect(r.hint).toContain("apa adanya");
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
  it("membentuk pola /r/G-XXXXXX", () => {
    expect(blankCardUrl("https://app.example", "G-0NUJXA")).toBe(
      "https://app.example/r/G-0NUJXA",
    );
  });

  it("tahan trailing slash ganda", () => {
    expect(blankCardUrl("https://app.example///", "G-0NUJXA")).toBe(
      "https://app.example/r/G-0NUJXA",
    );
  });
});

describe("activateUrl", () => {
  it("menunjuk form aktivasi dengan isNew=true", () => {
    expect(activateUrl("https://app.example/", "G-0NUJXA")).toBe(
      "https://app.example/r/G-0NUJXA/activate?isNew=true",
    );
  });
});

describe("isGoogleReviewLink", () => {
  it("menerima pola Google Review dan Maps", () => {
    expect(
      isGoogleReviewLink(
        "https://search.google.com/local/writereview?placeid=ChIJ1",
      ),
    ).toBe(true);
    expect(isGoogleReviewLink("https://g.page/r/ABC")).toBe(true);
    expect(isGoogleReviewLink("https://maps.app.goo.gl/xyz")).toBe(true);
    expect(isGoogleReviewLink("https://www.google.com/maps/place/X")).toBe(true);
  });

  it("menolak non-Google, http, dan string rusak", () => {
    expect(isGoogleReviewLink("https://www.tripadvisor.com/x")).toBe(false);
    expect(isGoogleReviewLink("http://g.page/r/ABC")).toBe(false);
    expect(isGoogleReviewLink("bukan-url")).toBe(false);
    expect(isGoogleReviewLink("")).toBe(false);
  });
});
