// PIN Keamanan kartu: 4-8 angka, hash scrypt di KV, tanpa pemulihan.
// Lihat CONTEXT.md (PIN Keamanan), ADR-0005.

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const PIN_PATTERN = /^\d{4,8}$/;
const SALT_BYTES = 16;
const KEY_BYTES = 64;

export function isValidPin(pin: string): boolean {
  return PIN_PATTERN.test(pin.trim());
}

export function hashPin(pin: string): string {
  const salt = randomBytes(SALT_BYTES);
  const hash = scryptSync(pin.trim(), salt, KEY_BYTES);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(pin.trim(), Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
