// Operasi domain aktivasi di atas lib/kv.ts. Satu-satunya storage app (ADR-0005).
// Key: card:<id> aktif, pend:<id> registrasi, scan:<id> hitungan, rl:* rate-limit,
// fp:<id>/<lk:<id> kegagalan PIN.

import { kvAvailable, kvDel, kvExecAll, kvGet, kvIncr, kvScan, kvSet, kvExpire } from "./kv";
import { isValidCardId } from "./qr";
import { verifyPin } from "./pin";

export interface ActiveCard {
  v: 1;
  nama: string;
  url: string;
  pinHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingRecord {
  v: 1;
  batch: string;
  createdAt: string;
}

export type ClaimResult = "claimed" | "taken" | "unavailable";
export type PinResult = "ok" | "wrong" | "locked" | "unavailable";

export const PIN_MAX_FAIL = 5;
export const PIN_LOCK_SECONDS = 900;
const RATE_WINDOW_MS = 3_600_000;
export const ACTIVATION_RATE_MAX = 10;
export const REGISTER_RATE_MAX = 60;

const activeKey = (id: string) => `card:${id}`;
const pendingKey = (id: string) => `pend:${id}`;
const scanKey = (id: string) => `scan:${id}`;
const failKey = (id: string) => `fp:${id}`;
const lockKey = (id: string) => `lk:${id}`;

function parse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function now(): string {
  return new Date().toISOString();
}

function rateKey(bucket: string, ip: string): string {
  const slot = Math.floor(Date.now() / RATE_WINDOW_MS);
  const safeIp = ip.replace(/[^a-zA-Z0-9.:_-]/g, "").slice(0, 64) || "unknown";
  return `rl:${bucket}:${safeIp}:${slot}`;
}

export async function getActiveCard(id: string): Promise<ActiveCard | null> {
  return parse<ActiveCard>(await kvGet(activeKey(id)));
}

export async function getPendingRecord(id: string): Promise<PendingRecord | null> {
  return parse<PendingRecord>(await kvGet(pendingKey(id)));
}

export async function registerSerials(
  ids: string[],
  batch: string,
): Promise<number> {
  if (!kvAvailable() || ids.length === 0) return 0;
  const stamp = now();
  const cmds = ids.map((id) => [
    "SET",
    pendingKey(id),
    JSON.stringify({ v: 1, batch, createdAt: stamp } satisfies PendingRecord),
    "NX",
  ]);
  const results = await kvExecAll(cmds);
  return results.filter((r) => r === "OK").length;
}

export async function claimCard(
  id: string,
  data: { nama: string; url: string; pinHash: string },
): Promise<ClaimResult> {
  if (!kvAvailable()) return "unavailable";
  const stamp = now();
  const record: ActiveCard = {
    v: 1,
    nama: data.nama,
    url: data.url,
    pinHash: data.pinHash,
    createdAt: stamp,
    updatedAt: stamp,
  };
  const wrote = await kvSet(activeKey(id), JSON.stringify(record), { nx: true });
  return wrote ? "claimed" : "taken";
}

export async function updateActiveCard(
  id: string,
  patch: { nama?: string; url?: string; pinHash?: string },
): Promise<ActiveCard | null> {
  const card = await getActiveCard(id);
  if (!card) return null;
  const next: ActiveCard = { ...card, ...patch, updatedAt: now() };
  await kvSet(activeKey(id), JSON.stringify(next));
  return next;
}

export async function getScanCount(id: string): Promise<number> {
  const raw = await kvGet(scanKey(id));
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export interface ListedCard {
  id: string;
  status: "active" | "pending";
  nama?: string;
  url?: string;
  batch?: string;
  createdAt?: string;
  scan: number;
}

// Daftar semua kartu untuk /cards (server-side saja). Aktif menang atas
// pending bila keduanya ada (pend tidak dihapus saat klaim, lihat claimCard).
// null bila KV mati. Serial tak valid dilewati agar key liar tak bocor ke UI.
export async function listCards(): Promise<ListedCard[] | null> {
  if (!kvAvailable()) return null;
  const activeKeys = await kvScan("card:*");
  const pendingKeys = await kvScan("pend:*");
  const ids = new Set<string>();
  for (const key of [...activeKeys, ...pendingKeys]) {
    const id = key.includes(":") ? key.split(":").slice(1).join(":") : "";
    if (isValidCardId(id)) ids.add(id);
  }
  const sorted = [...ids].sort();
  const payloads = await kvExecAll(
    sorted.map((id) => ["GET", `card:${id}`]),
  );
  const pendings = await kvExecAll(
    sorted.map((id) => ["GET", `pend:${id}`]),
  );
  const scans = await kvExecAll(sorted.map((id) => ["GET", `scan:${id}`]));
  return sorted.map((id, i) => {
    const card = parse<ActiveCard>(
      typeof payloads[i] === "string" ? payloads[i] : null,
    );
    const pending = parse<PendingRecord>(
      typeof pendings[i] === "string" ? pendings[i] : null,
    );
    const rawScan = scans[i];
    const scan =
      typeof rawScan === "string" && rawScan !== ""
        ? Number(rawScan)
        : 0;
    if (card) {
      return {
        id,
        status: "active" as const,
        nama: card.nama,
        url: card.url,
        createdAt: card.createdAt,
        scan: Number.isFinite(scan) ? scan : 0,
      };
    }
    return {
      id,
      status: "pending" as const,
      batch: pending?.batch,
      createdAt: pending?.createdAt,
      scan: Number.isFinite(scan) ? scan : 0,
    };
  });
}

export async function recordScan(id: string): Promise<number | null> {
  if (!kvAvailable()) return null;
  const n = await kvIncr(scanKey(id));
  if (n === 1) await kvExpire(scanKey(id), 60 * 60 * 24 * 365 * 2);
  return n;
}

// true = ditolak (melewati batas). KV mati = tanpa limit (aktivasi juga tak jalan).
export async function rateLimited(
  bucket: string,
  ip: string,
  max: number,
): Promise<boolean> {
  if (!kvAvailable()) return false;
  const key = rateKey(bucket, ip);
  const n = await kvIncr(key);
  if (n === null) return false;
  if (n === 1) await kvExpire(key, Math.ceil(RATE_WINDOW_MS / 1000) * 2);
  return n > max;
}

async function isLocked(id: string): Promise<boolean> {
  return (await kvGet(lockKey(id))) !== null;
}

async function registerFailure(id: string): Promise<boolean> {
  const n = await kvIncr(failKey(id));
  if (n === null) return false;
  await kvExpire(failKey(id), PIN_LOCK_SECONDS);
  if (n >= PIN_MAX_FAIL) {
    await kvSet(lockKey(id), "1", { ex: PIN_LOCK_SECONDS });
    return true;
  }
  return false;
}

export async function verifyCardPin(id: string, pin: string): Promise<PinResult> {
  if (!kvAvailable()) return "unavailable";
  if (await isLocked(id)) return "locked";
  const card = await getActiveCard(id);
  if (!card) return "wrong";
  if (verifyPin(pin, card.pinHash)) {
    await kvDel(failKey(id));
    return "ok";
  }
  return (await registerFailure(id)) ? "locked" : "wrong";
}
