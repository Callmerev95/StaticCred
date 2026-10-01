// Server actions jalur aktivasi (ADR-0005). Satu-satunya tulis KV dari client.

"use server";

import { headers } from "next/headers";
import { kvAvailable } from "@/lib/kv";
import { isGoogleReviewLink, isValidCardId } from "@/lib/qr";
import { isValidPin, hashPin } from "@/lib/pin";
import { ACTIVATION_RATE_MAX, REGISTER_RATE_MAX, claimCard, getActiveCard, rateLimited, registerSerials, updateActiveCard, verifyCardPin } from "@/lib/store";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

async function requestIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function activateCardAction(
  serial: string,
  input: { nama: string; url: string; pin: string },
): Promise<ActionResult> {
  const id = serial.trim();
  if (!isValidCardId(id)) return { ok: false, error: "Serial kartu tidak dikenal." };

  const nama = input.nama.trim();
  const url = input.url.trim();
  const pin = input.pin.trim();
  if (!nama || nama.length > 60) {
    return { ok: false, error: "Nama tempat usaha wajib diisi, maksimal 60 karakter." };
  }
  if (!isGoogleReviewLink(url)) {
    return {
      ok: false,
      error: "Link harus URL Google Maps atau Google Review yang valid.",
    };
  }
  if (!isValidPin(pin)) {
    return { ok: false, error: "PIN harus 4 sampai 8 angka." };
  }

  if (await rateLimited("act", await requestIp(), ACTIVATION_RATE_MAX)) {
    return {
      ok: false,
      error: "Terlalu banyak percobaan aktivasi dari jaringan ini. Coba lagi dalam satu jam.",
    };
  }

  const result = await claimCard(id, { nama, url, pinHash: hashPin(pin) });
  if (result === "unavailable") {
    return { ok: false, error: "Layanan aktivasi belum terkonfigurasi di server ini." };
  }
  if (result === "taken") {
    return {
      ok: false,
      error:
        "Kartu ini sudah diaktifkan orang lain. Untuk mengganti link, buka Kelola Kartu dan masukkan PIN.",
    };
  }
  return { ok: true };
}

export interface VerifyResult {
  ok: boolean;
  error?: string;
  card?: { nama: string; url: string };
}

export async function verifyPinAction(
  serial: string,
  pin: string,
): Promise<VerifyResult> {
  const id = serial.trim();
  if (!isValidCardId(id)) return { ok: false, error: "Serial kartu tidak dikenal." };
  if (!isValidPin(pin)) return { ok: false, error: "PIN harus 4 sampai 8 angka." };

  const result = await verifyCardPin(id, pin.trim());
  if (result === "unavailable") {
    return { ok: false, error: "Layanan aktivasi belum terkonfigurasi di server ini." };
  }
  if (result === "locked") {
    return {
      ok: false,
      error: "PIN terkunci setelah lima kali salah. Coba lagi dalam 15 menit.",
    };
  }
  if (result === "wrong") {
    return { ok: false, error: "PIN salah." };
  }
  const card = await getActiveCard(id);
  if (!card) return { ok: false, error: "Kartu tidak ditemukan." };
  return { ok: true, card: { nama: card.nama, url: card.url } };
}

export async function updateCardAction(
  serial: string,
  pin: string,
  input: { nama: string; url: string; pinBaru?: string },
): Promise<ActionResult> {
  const id = serial.trim();
  if (!isValidCardId(id)) return { ok: false, error: "Serial kartu tidak dikenal." };

  const verified = await verifyCardPin(id, pin.trim());
  if (verified !== "ok") {
    return {
      ok: false,
      error:
        verified === "locked"
          ? "PIN terkunci setelah lima kali salah. Coba lagi dalam 15 menit."
          : verified === "unavailable"
            ? "Layanan aktivasi belum terkonfigurasi di server ini."
            : "PIN salah.",
    };
  }

  const nama = input.nama.trim();
  const url = input.url.trim();
  if (!nama || nama.length > 60) {
    return { ok: false, error: "Nama tempat usaha wajib diisi, maksimal 60 karakter." };
  }
  if (!isGoogleReviewLink(url)) {
    return {
      ok: false,
      error: "Link harus URL Google Maps atau Google Review yang valid.",
    };
  }

  const patch: { nama: string; url: string; pinHash?: string } = { nama, url };
  const pinBaru = input.pinBaru?.trim() ?? "";
  if (pinBaru) {
    if (!isValidPin(pinBaru)) {
      return { ok: false, error: "PIN baru harus 4 sampai 8 angka." };
    }
    patch.pinHash = hashPin(pinBaru);
  }

  const updated = await updateActiveCard(id, patch);
  if (!updated) return { ok: false, error: "Kartu tidak ditemukan." };
  return { ok: true };
}

export interface RegisterResult {
  registered: number;
  available: boolean;
}

// Pendaftaran serial saat ID Baru / Buat 50 ID diklik (status Pending, ADR-0005).
export async function registerSerialsAction(
  ids: string[],
  batch: string,
): Promise<RegisterResult> {
  const valid = [...new Set(ids.map((s) => s.trim()))].filter(isValidCardId);
  if (valid.length === 0) return { registered: 0, available: false };
  if (!kvAvailable()) return { registered: 0, available: false };
  if (await rateLimited("reg", await requestIp(), REGISTER_RATE_MAX)) {
    return { registered: 0, available: true };
  }
  try {
    return { registered: await registerSerials(valid, batch), available: true };
  } catch {
    return { registered: 0, available: true };
  }
}
