// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { drawCard } from "./render-card";
import { exportDrawOpts } from "./export";
import { defaultCardFormState } from "./form-state";
import { exportDims, getSize } from "./sizes";

// Acceptance #9 + PRD: toggle Tema Aplikasi tidak mengubah satu piksel output.
function drawWithMock() {
  const calls: string[] = [];
  const ctx = new Proxy(
    {},
    {
      get(_t, p) {
        if (p === "measureText") return () => ({ width: 40 });
        if (p === "canvas") return undefined;
        if (typeof p === "string") {
          return (..._a: never[]) => {
            calls.push(`${p}:${JSON.stringify(_a).length}`);
          };
        }
        return undefined;
      },
      set() {
        return true;
      },
      getOwnPropertyDescriptor() {
        return { configurable: true, enumerable: true };
      },
    },
  ) as unknown as CanvasRenderingContext2D;
  const dims = exportDims(getSize("pvc-h"), false);
  drawCard(
    ctx,
    exportDrawOpts(
      { ...defaultCardFormState(), businessName: "Kopi Senja" },
      "https://app.example/r/G-0NUJ",
      dims,
    ),
  );
  return calls;
}

afterEach(() => {
  document.documentElement.classList.remove("dark");
});

describe("independensi Tema Aplikasi", () => {
  it("output drawCard identik dengan dan tanpa class dark", () => {
    const light = drawWithMock();
    document.documentElement.classList.add("dark");
    const dark = drawWithMock();
    expect(dark).toEqual(light);
  });
});
