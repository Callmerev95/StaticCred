// Validator link review + ID kartu kosong. Murni, tanpa network.
// Lihat CONTEXT.md (ID Kartu, Link Langsung vs Cetak Kosong), ADR-0003.

export const CARD_ID_PREFIX = "G-";
export const CARD_ID_LENGTH = 4;

// Huruf rancu I, L, O dibuang (mirip 1 dan 0). U dipakai karena
// ID referensi G-0NUJ memakainya, bentuknya tidak rancu.
const ID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateCardId(random: () => number = Math.random): string {
  let body = "";
  for (let i = 0; i < CARD_ID_LENGTH; i += 1) {
    body += ID_ALPHABET[Math.floor(random() * ID_ALPHABET.length)];
  }
  return `${CARD_ID_PREFIX}${body}`;
}

const CARD_ID_PATTERN = /^G-[0-9A-HJ-KM-NP-Z]{4}$/;

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
  if (host.includes("google.")) {
    return {
      ok: true,
      source: "google",
      url,
      hint: "Langsung buka form ulasan bintang 5",
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

// Pola QR Cetak Kosong: https://<app>/r/G-XXXX (placeholder, ADR-0003).
export function blankCardUrl(appUrl: string, cardId: string): string {
  return `${appUrl.replace(/\/+$/, "")}/r/${cardId.trim()}`;
}
