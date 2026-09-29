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
    expect(a.cardId).toMatch(/^G-.{4}$/);
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

  it("blank memakai pola /r/G-XXXX", () => {
    const s = {
      ...defaultCardFormState(),
      mode: "blank" as const,
      cardId: "G-0NUJ",
    };
    expect(qrPayloadOf(s, "https://app.example///")).toBe(
      "https://app.example/r/G-0NUJ",
    );
  });
});
