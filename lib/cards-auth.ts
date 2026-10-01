// Gerbang PIN halaman /cards (ADR-0006). Cookie HMAC 12 jam, server-only.
// ADMIN_PIN hanya dibaca dari env di server; tak pernah dikirim ke klien.

import { createHmac, timingSafeEqual } from "node:crypto";

export const CARDS_COOKIE = "cards_admin";
export const CARDS_SESSION_HOURS = 12;

function adminPin(): string {
  return process.env.ADMIN_PIN ?? "";
}

export function cardsAuthConfigured(): boolean {
  return adminPin().length > 0;
}

function sign(ts: string): string {
  return createHmac("sha256", adminPin()).update(ts).digest("hex");
}

// true bila cookie sesi valid dan belum kedaluwarsa.
export function verifyCardsSession(cookieValue: string | undefined): boolean {
  if (!adminPin() || !cookieValue) return false;
  const [ts, sig] = cookieValue.split(".");
  if (!ts || !sig || !/^\d+$/.test(ts)) return false;
  const ageMs = Date.now() - Number(ts);
  if (ageMs < 0 || ageMs > CARDS_SESSION_HOURS * 3_600_000) return false;
  const expected = Buffer.from(sign(ts), "hex");
  const actual = Buffer.from(sig, "hex");
  return (
    expected.length === actual.length && timingSafeEqual(expected, actual)
  );
}

export function issueCardsSession(): string {
  const ts = String(Date.now());
  return `${ts}.${sign(ts)}`;
}

// Banding PIN admin waktu-konstan; false bila env belum dipasang.
export function verifyAdminPin(pin: string): boolean {
  const secret = adminPin();
  if (!secret) return false;
  const a = Buffer.from(pin);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
