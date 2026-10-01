// Tujuan ulasan kanonik untuk scan: form tulis ulasan di Google Search
// (https://search.google.com/local/writereview?placeid=...), bukan Google Maps.
// Butuh place ID (ChIJ...) dari link yang ditempel. Tanpa place ID, link dipakai
// apa adanya. Lihat ADR-0005.

const WRITE_REVIEW_BASE = "https://search.google.com/local/writereview?placeid=";

// Pola place ID Google: ChIJ + isi base64-url (huruf, angka, -, _).
const PLACE_ID_PATTERN = /ChIJ[0-9A-Za-z_-]{10,}/;

// Ambil place ID dari teks link bebas. Hanya link host Google yang dianggap,
// agar token serupa di URL asing tidak salah rewrite.
export function extractPlaceId(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!parsed.hostname.toLowerCase().includes("google.")) return null;
  const match = url.match(PLACE_ID_PATTERN);
  return match ? match[0] : null;
}

// Rewrite ke URL writereview bila place ID terdeteksi. Sudah berupa link
// writereview dikembalikan apa adanya. Tidak bisa direwrite: null.
export function toWriteReviewUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  const placeId = extractPlaceId(url);
  if (!placeId) return null;
  return `${WRITE_REVIEW_BASE}${placeId}`;
}
