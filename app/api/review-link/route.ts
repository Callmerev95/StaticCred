// Proxy resolver tujuan ulasan untuk klien (hint live Link Langsung / form).
// Server yang memanggil resolver pihak ketiga; rate-limit per IP di KV.

import { isGoogleReviewLink } from "@/lib/qr";
import { resolveReviewUrl } from "@/lib/resolve-review";
import { toWriteReviewUrl } from "@/lib/review-url";
import { rateLimited } from "@/lib/store";

export const dynamic = "force-dynamic";

export const LINK_RATE_MAX = 60;

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const raw =
    body && typeof body === "object" && "url" in body
      ? (body as { url: unknown }).url
      : null;
  const url = typeof raw === "string" ? raw.trim() : "";
  if (!url || !isGoogleReviewLink(url)) {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (await rateLimited("rlv", ip, LINK_RATE_MAX)) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const local = toWriteReviewUrl(url);
  const reviewUrl = local ?? (await resolveReviewUrl(url));
  return Response.json({ ok: true, reviewUrl, generated: !local });
}
