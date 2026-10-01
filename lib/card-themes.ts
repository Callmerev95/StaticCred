// Token Tema Kartu untuk hasil cetak. Sumbu independen dari Tema Aplikasi:
// canvas menggambar piksel sendiri tanpa membaca CSS. Lihat ADR-0004,
// DESIGN.md § Card Themes.
// Nilai diukur dari piksel reference/google-lightmode.png dan
// reference/google-darkmode.png (u = 9,76 px di mockup).

export type CardThemeId = "dark" | "google";

export interface CardTheme {
  id: CardThemeId;
  // Ujung terang gradien latar; dipakai tes kontras sebagai kasus terburuk.
  bg: string;
  bgFrom: string;
  bgTo: string;
  heading: string;
  body: string;
  muted: string;
  star: string;
  hairline: string;
  verified: string;
  badgeFg: string;
  chipBg: string;
  chipBorder: string | null;
  chipShadow: boolean;
  pillBg: string;
  pillFg: string;
  pillBorder: string | null;
  nfcIcon: string;
  qrCardBg: string;
  qrCardBorder: string | null;
  qrCardShadow: string | null;
  qrPanel: string;
  qrFg: string;
  qrBg: string;
  qrAccent: string;
  ctaBg: string;
  ctaFg: string;
  cardBorder: string | null;
  serial: string;
  poweredBase: string;
  poweredBrand: string;
}

// Strip pelangi tepi atas kartu QR: biru → hijau → emas (tanpa merah).
export const QR_STRIP_STOPS: ReadonlyArray<readonly [number, string]> = [
  [0, "#4285F4"],
  [0.5, "#34A853"],
  [1, "#FBBC04"],
] as const;

export const VERIFIED_LABEL = "Google Verified";

export const CARD_THEMES: Record<CardThemeId, CardTheme> = {
  dark: {
    id: "dark",
    bg: "#161C2E",
    bgFrom: "#161C2E",
    bgTo: "#111726",
    heading: "#FFFFFF",
    body: "#CDD5E0",
    muted: "#8995A8",
    star: "#F2C14B",
    hairline: "#1D2537",
    verified: "#70A3F3",
    badgeFg: "#FFFFFF",
    chipBg: "#1F2839",
    chipBorder: "#2E3A52",
    chipShadow: false,
    pillBg: "#1F2839",
    pillFg: "#E9EEF7",
    pillBorder: null,
    nfcIcon: "#70A3F3",
    qrCardBg: "#111729",
    // Garis tepian pembungkus QR: 3,3:1 vs qrCardBg (WCAG 1.4.11 ≥3:1).
    qrCardBorder: "#5F6B80",
    qrCardShadow: null,
    qrPanel: "#FFFFFF",
    qrFg: "#111729",
    qrBg: "#FFFFFF",
    qrAccent: "#3663E3",
    ctaBg: "#3663E3",
    ctaFg: "#FFFFFF",
    cardBorder: "rgba(255,255,255,0.16)",
    serial: "#8995A8",
    poweredBase: "#9AA5B8",
    poweredBrand: "#FFFFFF",
  },
  google: {
    id: "google",
    bg: "#FAFAFB",
    bgFrom: "#FAFAFB",
    bgTo: "#EEF1F3",
    heading: "#111729",
    body: "#4A5565",
    muted: "#5F6B80",
    star: "#F2C14B",
    hairline: "#E4E7ED",
    verified: "#3663E3",
    badgeFg: "#111729",
    chipBg: "#FFFFFF",
    chipBorder: "rgba(17,23,41,0.06)",
    chipShadow: true,
    pillBg: "#D8E6FD",
    pillFg: "#2A4DD0",
    // Border pembungkus pill: 4,77 vs bg kartu, 3,95 vs bg pill (WCAG 1.4.11 ≥3:1).
    pillBorder: "#456FB8",
    nfcIcon: "#2A4DD0",
    qrCardBg: "#FFFFFF",
    qrCardBorder: null,
    qrCardShadow: "rgba(17,23,41,0.10)",
    qrPanel: "#F8FAFC",
    qrFg: "#111729",
    qrBg: "#F8FAFC",
    qrAccent: "#3663E3",
    ctaBg: "#3663E3",
    ctaFg: "#FFFFFF",
    cardBorder: null,
    serial: "#5F6B80",
    poweredBase: "#64708A",
    poweredBrand: "#364153",
  },
};

export function getCardTheme(id: CardThemeId = "dark"): CardTheme {
  const found = CARD_THEMES[id];
  if (!found) throw new Error(`Unknown card theme: ${String(id)}`);
  return found;
}

function luminance(hex: string): number {
  const c = hex.replace("#", "");
  const v = [0, 2, 4].map((i) => {
    const s = parseInt(c.slice(i, i + 2), 16) / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

// Rasio kontras WCAG untuk acceptance PRD (kedua Tema Kartu lolos kontras).
export function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}
