// Token Tema Kartu untuk hasil cetak. Sumbu independen dari Tema Aplikasi:
// canvas menggambar piksel sendiri tanpa membaca CSS. Lihat ADR-0004,
// DESIGN.md § Card Themes.

export type CardThemeId = "dark" | "google";

export interface CardTheme {
  id: CardThemeId;
  bg: string;
  heading: string;
  body: string;
  muted: string;
  star: string;
  hairline: string;
  badgeCircle: string;
  badgeG: string;
  badgeFg: string;
  pillBg: string;
  pillFg: string;
  nfcFg: string;
  qrFg: string;
  qrBg: string;
  qrBoxed: boolean;
  qrBoxBorder: string | null;
  ctaBg: string | null;
  ctaFg: string;
  ctaInBox: string;
  ctaOutline: boolean;
}

// Biru sampel piksel referensi: badge #3070E0, pill CTA #3871E0.
// QR selalu modul gelap di atas bidang terang, kedua tema. ECC H.
export const CARD_THEMES: Record<CardThemeId, CardTheme> = {
  dark: {
    id: "dark",
    bg: "#0a0a0a",
    heading: "#fafafa",
    body: "#d4d4d4",
    muted: "#a3a3a3",
    star: "#FBBC04",
    hairline: "rgba(255,255,255,0.16)",
    badgeCircle: "#ffffff",
    badgeG: "#4285F4",
    badgeFg: "#a3a3a3",
    pillBg: "rgba(255,255,255,0.14)",
    pillFg: "#fafafa",
    nfcFg: "#FBBC04",
    qrFg: "#0a0a0a",
    qrBg: "#ffffff",
    qrBoxed: true,
    qrBoxBorder: null,
    ctaBg: null,
    ctaFg: "#a3a3a3",
    ctaInBox: "#a3a3a3",
    ctaOutline: true,
  },
  google: {
    id: "google",
    bg: "#ffffff",
    heading: "#0a0a0a",
    body: "#444746",
    muted: "#5f6368",
    star: "#FBBC04",
    hairline: "#e5e5e5",
    badgeCircle: "#f1f3f4",
    badgeG: "#4285F4",
    badgeFg: "#3070E0",
    pillBg: "#f1f3f4",
    pillFg: "#444746",
    nfcFg: "#444746",
    qrFg: "#0a0a0a",
    qrBg: "#ffffff",
    qrBoxed: true,
    qrBoxBorder: "#e5e5e5",
    ctaBg: "#3871E0",
    ctaFg: "#ffffff",
    ctaInBox: "#3871E0",
    ctaOutline: false,
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
