import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CARD_THEMES,
  contrastRatio,
  getCardTheme,
} from "./card-themes";
import { drawCard, drawGoogleG, getQrInfo, qrBoxLayout, type DrawCardOpts } from "./render-card";
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

describe("qrBoxLayout", () => {
  it("simetri: pad kiri/kanan/atas/bawah identik untuk semua versi", () => {
    for (const moduleCount of [21, 25, 33, 41, 49, 57, 65]) {
      for (const availW of [200, 303, 400, 694]) {
        const lay = qrBoxLayout(moduleCount, availW, 15, 10);
        // Modul inset tepat innerPad dari keempat sisi.
        expect(lay.boxW).toBe(lay.drawn + lay.innerPad * 2);
        // Strip bawah simetris: pad + CTA + pad.
        expect(lay.boxH).toBe(
          lay.innerPad + lay.drawn + lay.gapCta + lay.ctaH + lay.innerPad,
        );
        // Padding selalu 2 modul.
        expect(lay.innerPad).toBe(Math.max(2, lay.cell * 2));
        expect(lay.cell).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("render nyata: modul dan CTA simetris dalam box (pvc-h dark)", () => {
    const rects: number[][] = [];
    class FakePath {
      rect(...args: number[]) {
        rects.push(args);
      }
    }
    vi.stubGlobal("Path2D", FakePath);
    try {
      const { ctx, calls } = createMockCtx();
      drawCard(ctx, BASE_OPTS);
      // Bounding box modul dari rect yang terekam.
      const xs = rects.map((r) => r[0]);
      const ys = rects.map((r) => r[1]);
      const cell = rects[0][2];
      const modMinX = Math.min(...xs);
      const modMaxEdge = Math.max(...xs) + cell;
      const modMinY = Math.min(...ys);
      // Box dari traceRoundRect: moveTo(boxX+rr, boxY), arcTo(boxX+boxW, ...).
      // Kumpulkan semua trace + aksi penutupnya.
      interface Trace {
        moveTo: number[];
        arcTos: number[][];
        action: string;
      }
      const traces: Trace[] = [];
      let curMove: number[] | null = null;
      let curArcs: number[][] = [];
      for (const c of calls) {
        if (c.method === "beginPath") {
          curMove = null;
          curArcs = [];
        } else if (c.method === "moveTo" && curArcs !== null) {
          if (curMove === null) curMove = c.args as number[];
        } else if (c.method === "arcTo") {
          curArcs.push(c.args as number[]);
        } else if (c.method === "fill" || c.method === "clip" || c.method === "stroke") {
          if (curMove && curArcs.length > 0) {
            traces.push({ moveTo: curMove, arcTos: curArcs, action: c.method });
          }
          curMove = null;
          curArcs = [];
        }
      }
      // Box QR = trace fill yang memuat modul dengan margin kecil.
      const box = traces.find((t) => {
        const rr = t.arcTos[0][4];
        const left = t.moveTo[0] - rr;
        const top = t.moveTo[1];
        const right = t.arcTos[0][0];
        return (
          t.action === "fill" &&
          left <= modMinX &&
          top <= modMinY &&
          right >= modMaxEdge &&
          right - left < 600
        );
      });
      expect(box).toBeDefined();
      const rr = box!.arcTos[0][4];
      const boxLeft = box!.moveTo[0] - rr;
      const boxTop = box!.moveTo[1];
      const boxRight = box!.arcTos[0][0];
      // Nilai harapan dari layout murni.
      const info = getQrInfo(BASE_OPTS.qrPayload);
      const lay = qrBoxLayout(info.moduleCount, 1011 * 0.3, 15, 10.11);
      expect(boxRight - boxLeft).toBe(lay.boxW);
      expect(modMinX - boxLeft).toBe(lay.innerPad);
      expect(modMinY - boxTop).toBe(lay.innerPad);
      // Baris finder teratas selalu dark penuh kolom 0..44:
      // kanan sisanya quiet zone + pad.
      const row0 = rects.filter((r) => r[1] === modMinY);
      const row0Last = Math.max(...row0.map((r) => r[0])) + lay.cell;
      expect(row0Last - modMinX).toBe(45 * lay.cell);
      expect(boxRight - row0Last).toBe(8 * lay.cell + lay.innerPad);
      // CTA center horizontal terhadap box.
      const cta = calls.find(
        (c) => c.method === "fillText" && c.args[0] === "SCAN ATAU TAP DI SINI",
      );
      expect(cta).toBeDefined();
      expect(cta!.args[1] as number).toBe(boxLeft + lay.boxW / 2);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("drawGoogleG", () => {
  it("memakai path official lobehub saat Path2D tersedia", () => {
    const seen: string[] = [];
    class FakePath {
      constructor(d: string) {
        seen.push(d);
      }
    }
    vi.stubGlobal("Path2D", FakePath);
    try {
      const { ctx, calls } = createMockCtx();
      drawGoogleG(ctx, 50, 50, 24);
      expect(seen.length).toBe(4);
      expect(seen[0]).toContain("M23 12.245");
      expect(calls.filter((c) => c.method === "fill").length).toBe(4);
      expect(calls.some((c) => c.method === "fillText")).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("fallback busur tanpa Path2D", () => {
    const { ctx, calls } = createMockCtx();
    drawGoogleG(ctx, 50, 50, 24);
    expect(calls.filter((c) => c.method === "stroke").length).toBe(4);
    expect(calls.some((c) => c.method === "fillText")).toBe(false);
  });

  it("G dipakai kedua tema tanpa teks", () => {
    for (const cardTheme of ["dark", "google"] as const) {
      const { ctx, calls } = createMockCtx();
      drawCard(ctx, { ...BASE_OPTS, cardTheme });
      expect(textsOf(calls)).not.toContain("G");
    }
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

  it("wifi digambar bersama pill NFC (dark: 3 busur, tanpa NFC: 0)", () => {
    class FakePath {
      rect() {}
    }
    vi.stubGlobal("Path2D", FakePath);
    try {
      const withNfc = createMockCtx();
      drawCard(withNfc.ctx, { ...BASE_OPTS, cardTheme: "dark" });
      const withoutNfc = createMockCtx();
      drawCard(withoutNfc.ctx, {
        ...BASE_OPTS,
        cardTheme: "dark",
        showNfc: false,
      });
      const arcs = (c: Call[]) => c.filter((x) => x.method === "arc").length;
      expect(arcs(withNfc.calls)).toBe(3);
      expect(arcs(withoutNfc.calls)).toBe(0);
    } finally {
      vi.unstubAllGlobals();
    }
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
