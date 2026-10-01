import { describe, expect, it } from "vitest";
import { hashPin, isValidPin, verifyPin } from "./pin";

describe("isValidPin", () => {
  it("menerima 4-8 angka", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("12345678")).toBe(true);
  });

  it("menolak non-angka dan panjang di luar rentang", () => {
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("123456789")).toBe(false);
    expect(isValidPin("12ab")).toBe(false);
    expect(isValidPin("")).toBe(false);
  });
});

describe("hashPin / verifyPin", () => {
  it("hash unik per panggilan dan cocok untuk PIN sama", () => {
    const a = hashPin("1234");
    const b = hashPin("1234");
    expect(a).not.toBe(b);
    expect(verifyPin("1234", a)).toBe(true);
    expect(verifyPin("1234", b)).toBe(true);
  });

  it("menolak PIN salah dan format hash rusak", () => {
    const stored = hashPin("4321");
    expect(verifyPin("1234", stored)).toBe(false);
    expect(verifyPin("1234", "rusak")).toBe(false);
    expect(verifyPin("1234", "bcrypt$abc$def")).toBe(false);
  });
});
