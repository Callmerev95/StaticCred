import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CARD_THEMES,
  contrastRatio,
  getCardTheme,
} from "./card-themes";
import { drawCard, getQrInfo, type DrawCardOpts } from "./render-card";
import { CARD_SIZES, exportDims } from "./sizes";

interface Call {
  method: string;
  args: unknown[];
}

// Mock ctx perekam: semua method dicatat, semua set properti disimpan.
function createMockCtx() {
  const calls: Call[] = [];
  const props: Record<string, unknown> = {};
  const ctx = new Proxy(
    {},
    {
      get(_t, p) {
        if (p === "measureText") {
          return (s: string) => ({ width: s.length * 8 });
        }
        if (typeof p === "string") {
          if (p in props) return props[p];
          return (...args: unknown[]) => {
            calls.push({ method: p, args });
          };
        }
        return undefined;
      },
      set(_t, p, v) {
        props[p as string] = v;
        return true;
      },
    },
  ) as unknown as CanvasRenderingContext2D;
  return { ctx, calls, props };
}

const BASE_OPTS: DrawCardOpts = {
  widthPx: 1011,
  heightPx: 638,
  businessName: "Kopi Senja Utama",
  qrPayload: "https://search.google.com/local/writereview?placeid=ChIJN1t",
  cardId: "G-0NUJ",
};

function textsOf(calls: Call[]): string[] {
  return calls
    .filter((c) => c.method === "fillText")
    .map((c) => String(c.args[0]));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getCardTheme", () => {
  it("default dark", () => {
    expect(getCardTheme().id).toBe("dark");
    expect(getCardTheme("google").bg).toBe("#ffffff");
  });

  it("melempar untuk id tak dikenal", () => {
    // @ts-expect-error sengaja id salah untuk uji guard
    expect(() => getCardTheme("neon")).toThrow("Unknown card theme");
  });
});

describe("kontras Tema Kartu (acceptance PRD)", () => {
  it("heading di atas bg lolos AA kedua tema", () => {
    for (const t of [CARD_THEMES.dark, CARD_THEMES.google]) {
      expect(contrastRatio(t.heading, t.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(t.body, t.bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("QR modul gelap di bidang terang kedua tema", () => {
    for (const t of [CARD_THEMES.dark, CARD_THEMES.google]) {
      expect(contrastRatio(t.qrFg, t.qrBg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("getQrInfo", () => {
  it("versi valid untuk payload pendek", () => {
    const info = getQrInfo("https://app.example/r/G-0NUJ");
    expect(info.moduleCount).toBe(17 + info.version * 4);
    expect(info.version).toBeGreaterThanOrEqual(1);
    expect(info.tooDense).toBe(false);
  });

  it("menandai tooDense saat versi di atas 10", () => {
    const info = getQrInfo(`https://app.example/review?placeid=${"x".repeat(400)}`);
    expect(info.tooDense).toBe(true);
  });
});

describe("drawCard", () => {
  it("melempar untuk dimensi invalid dan payload kosong", () => {
    const { ctx } = createMockCtx();
    expect(() => drawCard(ctx, { ...BASE_OPTS, widthPx: 0 })).toThrow();
    expect(() => drawCard(ctx, { ...BASE_OPTS, qrPayload: "   " })).toThrow();
  });

  it("menggambar nama, CTA, serial, dan caption QR", () => {
    const { ctx, calls } = createMockCtx();
    drawCard(ctx, BASE_OPTS);
    const texts = textsOf(calls);
    expect(texts).toContain("Kopi Senja Utama");
    expect(texts).toContain("SCAN ATAU TAP DI SINI");
    expect(texts).toContain("G-0NUJ");
    expect(texts).toContain("ECC-H • 4 MOD");
    expect(texts).toContain("5.0");
  });

  it("tanpa nama toko memakai judul sebagai baris besar (Cetak Kosong)", () => {
    const { ctx, calls } = createMockCtx();
    drawCard(ctx, { ...BASE_OPTS, businessName: "   " });
    expect(textsOf(calls)).toContain("Beri Ulasan di Google");
  });

  it("toggle false menyembunyikan bintang, NFC, dan serial", () => {
    const { ctx, calls } = createMockCtx();
    drawCard(ctx, {
      ...BASE_OPTS,
      showStars: false,
      showNfc: false,
      showSerial: false,
    });
    const texts = textsOf(calls);
    expect(texts).not.toContain("5.0");
    expect(texts).not.toContain("TAP NFC");
    expect(texts).not.toContain("G-0NUJ");
  });

  it("bleed true menggambar crop marks, false tidak", () => {
    const a = createMockCtx();
    drawCard(a.ctx, BASE_OPTS);
    const b = createMockCtx();
    drawCard(b.ctx, { ...BASE_OPTS, bleed: true });
    const strokes = (calls: Call[]) =>
      calls.filter((c) => c.method === "stroke").length;
    expect(strokes(b.calls)).toBeGreaterThan(strokes(a.calls));
  });

  it("deterministik: opts sama menghasilkan calls identik", () => {
    const a = createMockCtx();
    const b = createMockCtx();
    drawCard(a.ctx, BASE_OPTS);
    drawCard(b.ctx, BASE_OPTS);
    expect(JSON.stringify(b.calls)).toBe(JSON.stringify(a.calls));
  });

  it("memakai Path2D saat tersedia", () => {
    const rects: unknown[][] = [];
    class FakePath {
      rect(...args: unknown[]) {
        rects.push(args);
      }
    }
    vi.stubGlobal("Path2D", FakePath);
    const { ctx, calls } = createMockCtx();
    drawCard(ctx, BASE_OPTS);
    expect(rects.length).toBeGreaterThan(100);
    expect(calls.some((c) => c.method === "fill")).toBe(true);
  });

  it("fallback fillRect saat Path2D tidak ada", () => {
    const { ctx, calls } = createMockCtx();
    drawCard(ctx, BASE_OPTS);
    const fills = calls.filter((c) => c.method === "fillRect");
    expect(fills.length).toBeGreaterThan(100);
  });

  it("snapshot calls per tema", () => {
    for (const cardTheme of ["dark", "google"] as const) {
      const { ctx, calls } = createMockCtx();
      drawCard(ctx, { ...BASE_OPTS, cardTheme });
      expect(calls).toMatchSnapshot();
    }
  });

  it("mendukung teks override", () => {
    const { ctx, calls } = createMockCtx();
    drawCard(ctx, {
      ...BASE_OPTS,
      texts: { cta: "SCAN DI SINI" },
    });
    const texts = textsOf(calls);
    expect(texts).toContain("SCAN DI SINI");
    expect(texts).not.toContain("SCAN ATAU TAP DI SINI");
  });

  it("render semua 5 varian PRD tanpa throw, dua tema", () => {
    for (const size of CARD_SIZES) {
      for (const bleed of [false, true]) {
        const d = exportDims(size, bleed);
        for (const cardTheme of ["dark", "google"] as const) {
          const { ctx, calls } = createMockCtx();
          drawCard(ctx, {
            ...BASE_OPTS,
            widthPx: d.widthPx,
            heightPx: d.heightPx,
            bleed,
            cardTheme,
          });
          expect(textsOf(calls)).toContain("Kopi Senja Utama");
        }
      }
    }
  });
});
