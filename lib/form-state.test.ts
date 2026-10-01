import { describe, expect, it } from "vitest";
import {
  BUSINESS_NAME_MAX,
  defaultCardFormState,
  QR_DEBOUNCE_MS,
  qrPayloadOf,
} from "./form-state";

describe("defaultCardFormState", () => {
  it("mode direct, tema kartu dark, toggle ikut referensi", () => {
    const s = defaultCardFormState();
    expect(s.mode).toBe("direct");
    expect(s.cardTheme).toBe("dark");
    expect(s.showStars).toBe(true);
    expect(s.showNfc).toBe(true);
    expect(s.showSerial).toBe(false);
    expect(s.bleed).toBe(false);
  });

  it("cardId awal valid dan unik per sesi", () => {
    const a = defaultCardFormState();
    const b = defaultCardFormState();
    expect(a.cardId).toMatch(/^G-.{6}$/);
    expect(a.cardId).not.toBe(b.cardId);
  });
});

describe("batas dan waktu", () => {
  it("nama maksimal 60 karakter", () => {
    expect(BUSINESS_NAME_MAX).toBe(60);
  });

  it("debounce di bawah 300ms (acceptance #5)", () => {
    expect(QR_DEBOUNCE_MS).toBeLessThan(300);
  });
});

describe("qrPayloadOf", () => {
  it("direct memakai verbatim link (trim saja)", () => {
    const s = { ...defaultCardFormState(), reviewLink: "  https://google.com/x  " };
    expect(qrPayloadOf(s)).toBe("https://google.com/x");
  });

  it("direct dengan place ID di-rewrite ke form tulis ulasan Google Search", () => {
    const s = {
      ...defaultCardFormState(),
      reviewLink:
        "https://www.google.com/maps/place/?q=place_id:ChIJ149LSEexzS0RYOTs2W8-6NY",
    };
    expect(qrPayloadOf(s)).toBe(
      "https://search.google.com/local/writereview?placeid=ChIJ149LSEexzS0RYOTs2W8-6NY",
    );
  });

  it("blank memakai pola /r/G-XXXXXX", () => {
    const s = {
      ...defaultCardFormState(),
      mode: "blank" as const,
      cardId: "G-0NUJXA",
    };
    expect(qrPayloadOf(s, "https://app.example///")).toBe(
      "https://app.example/r/G-0NUJXA",
    );
  });

  it("blank tanpa cardId menghasilkan payload kosong", () => {
    const s = { ...defaultCardFormState(), mode: "blank" as const, cardId: "  " };
    expect(qrPayloadOf(s, "https://app.example")).toBe("");
  });
});
