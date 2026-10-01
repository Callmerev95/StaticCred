// POST {"pin"} untuk halaman /cards: benar → cookie sesi httpOnly 12 jam.

import {
  CARDS_COOKIE,
  CARDS_SESSION_HOURS,
  cardsAuthConfigured,
  issueCardsSession,
  verifyAdminPin,
} from "@/lib/cards-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  if (!cardsAuthConfigured()) {
    return Response.json({ ok: false, error: "unconfigured" }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const raw =
    body && typeof body === "object" && "pin" in body
      ? (body as { pin: unknown }).pin
      : null;
  const pin = typeof raw === "string" ? raw.trim() : "";
  if (!pin || !verifyAdminPin(pin)) {
    return Response.json({ ok: false, error: "wrong_pin" }, { status: 401 });
  }
  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${CARDS_COOKIE}=${issueCardsSession()}; Path=/cards; HttpOnly; SameSite=Lax; Max-Age=${CARDS_SESSION_HOURS * 3600}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
  return res;
}
