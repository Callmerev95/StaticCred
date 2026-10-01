import { describe, expect, it } from "vitest";
import { formatCardDate } from "./cards-format";

describe("formatCardDate", () => {
  it("format id-ID pendek dengan jam", () => {
    expect(formatCardDate("2026-09-30T23:02:00.000Z")).toMatch(
      /^\d{1,2} (Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des) \d{4}, \d{2}\.\d{2}$/,
    );
  });

  it("strip untuk kosong atau rusak", () => {
    expect(formatCardDate(undefined)).toBe("-");
    expect(formatCardDate("")).toBe("-");
    expect(formatCardDate("bukan-tanggal")).toBe("-");
  });
});
