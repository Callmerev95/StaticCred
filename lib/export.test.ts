// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  assertExportDims,
  exportDrawOpts,
  exportFileName,
  makePdf,
  pdfSizeMm,
  QR_PAYLOAD_WARN_LEN,
  renderOffscreen,
} from "./export";
import { defaultCardFormState } from "./form-state";
import { CARD_SIZES, exportDims } from "./sizes";

function stubCanvas() {
  const calls: string[] = [];
  HTMLCanvasElement.prototype.getContext = function () {
    return new Proxy(
      {},
      {
        get(_t, p) {
          if (p === "measureText") return () => ({ width: 40 });
          if (p === "canvas") return undefined;
          if (p === "createLinearGradient") {
            return () => ({ addColorStop: () => {} });
          }
          if (typeof p === "string") {
            return () => {
              calls.push(p);
            };
          }
          return undefined;
        },
        set() {
          return true;
        },
      },
    ) as unknown as CanvasRenderingContext2D;
  } as never;
  return calls;
}

// PNG 1x1 valid untuk uji bungkus PDF (bukan hasil render).
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const MM_TO_PT = 72 / 25.4;

function mediaBoxPt(pdfText: string): [number, number] {
  const m = pdfText.match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);
  if (!m) throw new Error("MediaBox tidak ditemukan di output PDF.");
  return [parseFloat(m[1]), parseFloat(m[2])];
}

describe("exportFileName", () => {
  it("format staticcred-size-theme-bleed.ext", () => {
    expect(exportFileName("pvc-h", "dark", false, "png")).toBe(
      "staticcred-pvc-h-dark.png",
    );
    expect(exportFileName("a6", "google", true, "pdf")).toBe(
      "staticcred-a6-google-bleed.pdf",
    );
  });
});

describe("pdfSizeMm", () => {
  it("tanpa bleed sama dengan mm varian", () => {
    expect(pdfSizeMm(CARD_SIZES[0], false)).toEqual({
      widthMm: 85.6,
      heightMm: 54,
    });
  });

  it("bleed menambah 3 mm tiap sisi", () => {
    expect(pdfSizeMm(CARD_SIZES[0], true)).toEqual({
      widthMm: 91.6,
      heightMm: 60,
    });
  });
});

describe("matriks 5 ukuran x 2 tema", () => {
  stubCanvas();
  const form = {
    ...defaultCardFormState(),
    businessName: "Kopi Senja",
    cardId: "G-0NUJXA",
  };

  it("render offscreen dimensi persis tabel PRD", () => {
    for (const size of CARD_SIZES) {
      for (const bleed of [false, true]) {
        for (const cardTheme of ["dark", "google"] as const) {
          const dims = exportDims(size, bleed);
          const canvas = renderOffscreen(
            exportDrawOpts(
              { ...form, cardTheme, bleed },
              "https://app.example/r/G-0NUJXA",
              dims,
            ),
          );
          expect([canvas.width, canvas.height]).toEqual([
            dims.widthPx,
            dims.heightPx,
          ]);
          expect(() =>
            assertExportDims(size, bleed, canvas),
          ).not.toThrow();
        }
      }
    }
  });

  it("assertExportDims menolak dimensi salah", () => {
    expect(() =>
      assertExportDims(CARD_SIZES[0], false, { width: 1, height: 1 }),
    ).toThrow("tidak cocok");
  });

  it("MediaBox PDF presisi mm semua varian", () => {
    for (const size of CARD_SIZES) {
      for (const bleed of [false, true]) {
        const page = pdfSizeMm(size, bleed);
        const pdf = makePdf(TINY_PNG, page.widthMm, page.heightMm);
        const [wPt, hPt] = mediaBoxPt(pdf.output());
        expect(Math.abs(wPt - page.widthMm * MM_TO_PT)).toBeLessThan(0.05);
        expect(Math.abs(hPt - page.heightMm * MM_TO_PT)).toBeLessThan(0.05);
      }
    }
  });
});

describe("ambang peringatan payload", () => {
  it("200 karakter sesuai acceptance #7", () => {
    expect(QR_PAYLOAD_WARN_LEN).toBe(200);
  });
});
