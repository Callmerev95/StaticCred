// Validator link review + ID kartu kosong. Murni, tanpa network.
// Lihat CONTEXT.md (Serial, Link Langsung vs Cetak Kosong), ADR-0005.
import { extractPlaceId } from "./review-url";

export const CARD_ID_PREFIX = "G-";
export const CARD_ID_LENGTH = 6;

// Alfabet 33 karakter: huruf rancu I, L, O dibuang (mirip 1 dan 0).
// U dipakai karena ID referensi lama memakainya, bentuknya tidak rancu.
const ID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateCardId(random: () => number = Math.random): string {
  let body = "";
  for (let i = 0; i < CARD_ID_LENGTH; i += 1) {
    body += ID_ALPHABET[Math.floor(random() * ID_ALPHABET.length)];
  }
  return `${CARD_ID_PREFIX}${body}`;
}

const CARD_ID_PATTERN = /^G-[0-9A-HJ-KM-NP-Z]{6}$/;

export function isValidCardId(id: string): boolean {
  return CARD_ID_PATTERN.test(id.trim());
}

export type ReviewSource = "google" | "tripadvisor" | "other";

export interface LinkCheck {
  ok: boolean;
  source: ReviewSource;
  url: string;
  hint: string;
}

// Paste bebas: trim saja, tanpa fetch. Domain hanya untuk hint UI.
export function checkReviewLink(raw: string): LinkCheck {
  const url = raw.trim();
  if (!url) {
    return { ok: false, source: "other", url: "", hint: "Tempel link review dulu." };
  }
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return {
      ok: false,
      source: "other",
      url,
      hint: "Format link tidak valid, butuh https://",
    };
  }
  if (host.includes("google.") || isGoogleReviewLink(url)) {
    return {
      ok: true,
      source: "google",
      url,
      hint: extractPlaceId(url)
        ? "QR menuju form tulis ulasan Google Search"
        : "QR membuka link ini apa adanya (tanpa place ID)",
    };
  }
  if (host.includes("tripadvisor.")) {
    return {
      ok: true,
      source: "tripadvisor",
      url,
      hint: "Link TripAdvisor terbaca",
    };
  }
  return {
    ok: true,
    source: "other",
    url,
    hint: "Link diterima (bukan Google/TripAdvisor)",
  };
}

// Pola QR Cetak Kosong: https://<app>/r/G-XXXXXX (ADR-0005).
export function blankCardUrl(appUrl: string, cardId: string): string {
  return `${appUrl.replace(/\/+$/, "")}/r/${cardId.trim()}`;
}

// Link aktivasi untuk tombol Buka Link / ekspor CSV reseller.
export function activateUrl(appUrl: string, cardId: string): string {
  return `${blankCardUrl(appUrl, cardId)}/activate?isNew=true`;
}

// Tujuan ulasan yang diizinkan untuk aktivasi (divalidasi server-side).
export function isGoogleReviewLink(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  if (host === "g.page" || host.endsWith(".g.page")) return true;
  if (host === "maps.app.goo.gl") return true;
  return host.includes("google.");
}
