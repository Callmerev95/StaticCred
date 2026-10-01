// Server-only: ubah link Google Maps menjadi tujuan tulis ulasan Google Search
// lewat resolver pihak ketiga (default: productmate, tanpa API key). Gagal di sini
// bukan error: pemanggil wajib fallback ke link apa adanya. Lihat ADR-0005.

import { createHash } from "node:crypto";
import { kvGet, kvSet } from "@/lib/kv";
import { isGoogleReviewLink } from "@/lib/qr";
import { toWriteReviewUrl } from "@/lib/review-url";

const RESOLVER_ENDPOINT =
  process.env.REVIEW_LINK_API ||
  "https://productmate.com/api/v1/google-review-link";
const RESOLVER_TIMEOUT_MS = 10_000;
const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;

function cacheKey(url: string): string {
  return `pl:${createHash("sha1").update(url).digest("hex")}`;
}

// Kembalikan URL writereview untuk link tempelan, atau null bila tak bisa
// digenerate (link dipakai apa adanya). Selalu tanpa lempar exception.
export async function resolveReviewUrl(raw: string): Promise<string | null> {
  const url = raw.trim();
  const local = toWriteReviewUrl(url);
  if (local) return local;
  if (!url || !isGoogleReviewLink(url)) return null;

  const key = cacheKey(url);
  try {
    const cached = await kvGet(key);
    const cachedUrl = cached ? toWriteReviewUrl(cached) : null;
    if (cachedUrl) return cachedUrl;
  } catch {
    // KV bermasalah: lanjut tanpa cache.
  }

  try {
    const res = await fetch(RESOLVER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maps_url: url }),
      signal: AbortSignal.timeout(RESOLVER_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { review_url?: unknown };
    const review = toWriteReviewUrl(
      typeof data.review_url === "string" ? data.review_url : "",
    );
    if (!review) return null;
    try {
      await kvSet(key, review, { ex: CACHE_TTL_SECONDS });
    } catch {
      // Gagal menulis cache tidak menggagalkan hasil.
    }
    return review;
  } catch {
    return null;
  }
}
