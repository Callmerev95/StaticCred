import { describe, expect, it } from "vitest";
import {
  CARD_SIZES,
  dimensionBadge,
  exportDims,
  getSize,
  mmToPx,
  outputSummary,
} from "./sizes";

describe("mmToPx", () => {
  it("mengikuti px = round(mm * 300 / 25.4)", () => {
    expect(mmToPx(25.4)).toBe(300);
    expect(mmToPx(85.6)).toBe(1011);
    expect(mmToPx(54)).toBe(638);
  });
});

describe("CARD_SIZES", () => {
  it("berisi 5 varian sesuai PRD", () => {
    expect(CARD_SIZES.map((s) => s.id)).toEqual([
      "pvc-h",
      "pvc-v",
      "a6",
      "a7",
      "stiker-70",
    ]);
  });

  it("dimensi piksel persis tabel PRD", () => {
    expect([getSize("pvc-h").widthPx, getSize("pvc-h").heightPx]).toEqual([
      1011, 638,
    ]);
    expect([getSize("pvc-v").widthPx, getSize("pvc-v").heightPx]).toEqual([
      638, 1011,
    ]);
    expect([getSize("a6").widthPx, getSize("a6").heightPx]).toEqual([
      1240, 1748,
    ]);
    expect([getSize("a7").widthPx, getSize("a7").heightPx]).toEqual([
      874, 1240,
    ]);
    expect([
      getSize("stiker-70").widthPx,
      getSize("stiker-70").heightPx,
    ]).toEqual([827, 827]);
  });

  it("getSize melempar untuk id tak dikenal", () => {
    // @ts-expect-error sengaja id salah untuk uji guard
    expect(() => getSize("a3")).toThrow("Unknown size id");
  });
});

describe("exportDims (bleed 3mm/sisi)", () => {
  it("tanpa bleed sama dengan dimensi dasar", () => {
    expect(exportDims(getSize("pvc-h"), false)).toEqual({
      widthPx: 1011,
      heightPx: 638,
    });
  });

  it("dengan bleed sesuai tabel PRD", () => {
    expect(exportDims(getSize("pvc-h"), true)).toEqual({
      widthPx: 1082,
      heightPx: 709,
    });
    expect(exportDims(getSize("pvc-v"), true)).toEqual({
      widthPx: 709,
      heightPx: 1082,
    });
    expect(exportDims(getSize("a6"), true)).toEqual({
      widthPx: 1311,
      heightPx: 1819,
    });
    expect(exportDims(getSize("a7"), true)).toEqual({
      widthPx: 945,
      heightPx: 1311,
    });
    expect(exportDims(getSize("stiker-70"), true)).toEqual({
      widthPx: 898,
      heightPx: 898,
    });
  });
});

describe("label UI", () => {
  it("badge dimensi memakai format stitch", () => {
    expect(dimensionBadge(getSize("pvc-h"))).toBe("1011 × 638 px @ 300 DPI");
  });

  it("ringkasan output memakai format stitch", () => {
    expect(outputSummary(getSize("pvc-h"), true)).toBe(
      "Output Piksel: 1082 × 709 px (+bleed 3mm)",
    );
    expect(outputSummary(getSize("pvc-h"), false)).toBe(
      "Output Piksel: 1011 × 638 px",
    );
  });
});
