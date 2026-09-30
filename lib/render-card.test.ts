import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CARD_THEMES,
  contrastRatio,
  getCardTheme,
} from "./card-themes";
import { drawCard, drawGoogleG, getQrInfo, type DrawCardOpts } from "./render-card";
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

  it("badge biru dan NFC emas lolos untuk teks besar", () => {
    expect(
      contrastRatio(CARD_THEMES.google.badgeFg, CARD_THEMES.google.bg),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(CARD_THEMES.dark.nfcFg, CARD_THEMES.dark.bg),
    ).toBeGreaterThanOrEqual(4.5);
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

describe("drawGoogleG", () => {
  it("memakai empat warna official tanpa teks", () => {
    const { ctx, calls, props } = createMockCtx();
    drawGoogleG(ctx, 50, 50, 24);
    const strokes = calls.filter((c) => c.method === "stroke");
    expect(strokes.length).toBe(4);
    expect(props["strokeStyle"]).toBeDefined();
    expect(
      calls.some((c) => c.method === "fillText"),
    ).toBe(false);
  });

  it("dipakai badge tema google, bukan tema dark", () => {
    const g = createMockCtx();
    drawCard(g.ctx, { ...BASE_OPTS, cardTheme: "google" });
    const d = createMockCtx();
    drawCard(d.ctx, { ...BASE_OPTS, cardTheme: "dark" });
    const gTexts = textsOf(g.calls);
    const dTexts = textsOf(d.calls);
    expect(gTexts).not.toContain("G");
    expect(dTexts).toContain("G");
  });
});

describe("drawCard", () => {
  it("melempar untuk dimensi invalid dan payload kosong", () => {
    const { ctx } = createMockCtx();
    expect(() => drawCard(ctx, { ...BASE_OPTS, widthPx: 0 })).toThrow();
    expect(() => drawCard(ctx, { ...BASE_OPTS, qrPayload: "   " })).toThrow();
  });

  it("landscape: nama, CTA di bawah QR, serial footer, tanpa caption", () => {
    const { ctx, calls } = createMockCtx();
    drawCard(ctx, BASE_OPTS);
    const texts = textsOf(calls);
    expect(texts).toContain("Kopi Senja Utama");
    expect(texts).toContain("SCAN ATAU TAP DI SINI");
    expect(texts).toContain("G-0NUJ");
    expect(texts.some((t) => t.includes("ECC-H"))).toBe(false);
    expect(texts).toContain("5.0");
  });

  it("portrait: kolom tengah dengan pill CTA dan serial tengah", () => {
    const { ctx, calls } = createMockCtx();
    drawCard(ctx, {
      ...BASE_OPTS,
      widthPx: 638,
      heightPx: 1011,
      cardTheme: "google",
    });
    const texts = textsOf(calls);
    expect(texts).toContain("Kopi Senja Utama");
    expect(texts).toContain("SCAN ATAU TAP DI SINI");
    expect(texts).toContain("G-0NUJ");
    expect(texts.filter((t) => t === "SCAN ATAU TAP DI SINI").length).toBe(1);
  });

  it("persegi memakai cabang portrait (CTA dan serial center)", () => {
    const { ctx, calls } = createMockCtx();
    drawCard(ctx, {
      ...BASE_OPTS,
      widthPx: 827,
      heightPx: 827,
      cardTheme: "dark",
      cardId: "G-0NUJ",
    });
    const at = (text: string) =>
      calls
        .filter((c) => c.method === "fillText" && c.args[0] === text)
        .map((c) => c.args[1] as number);
    expect(at("SCAN ATAU TAP DI SINI")).toEqual([413.5]);
    expect(at("G-0NUJ")).toEqual([413.5]);
  });

  it("wifi digambar bersama pill NFC (dark: 4 busur, tanpa NFC: 1)", () => {
    const withNfc = createMockCtx();
    drawCard(withNfc.ctx, { ...BASE_OPTS, cardTheme: "dark" });
    const withoutNfc = createMockCtx();
    drawCard(withoutNfc.ctx, {
      ...BASE_OPTS,
      cardTheme: "dark",
      showNfc: false,
    });
    const arcs = (c: Call[]) => c.filter((x) => x.method === "arc").length;
    expect(arcs(withNfc.calls)).toBe(4);
    expect(arcs(withoutNfc.calls)).toBe(1);
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
