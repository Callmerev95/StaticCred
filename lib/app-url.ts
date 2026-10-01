// Basis URL cetak. Domain kanonik dari NEXT_PUBLIC_APP_URL (ADR-0005),
// fallback origin runtime. QR fisik tidak bisa diganti setelah dicetak,
// jadi perbedaan origin vs kanonik wajib terlihat di UI.

const envUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

export function canonicalAppUrl(): string {
  return envUrl.replace(/\/+$/, "");
}

export function appBaseUrl(): string {
  const canonical = canonicalAppUrl();
  if (canonical) return canonical;
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

// Status peringatan cetak: null = aman, atau pesan satu baris untuk panel blank.
export function printUrlWarning(): string | null {
  const canonical = canonicalAppUrl();
  if (typeof window === "undefined") return null;
  const origin = window.location.origin;
  if (!canonical) {
    return `Domain kanonik belum diatur, QR memakai origin halaman ini (${origin}). Dari localhost, QR tidak terbuka di ponsel.`;
  }
  if (origin !== canonical) {
    return `QR memakai domain kanonik ${canonical}, bukan origin halaman ini (${origin}).`;
  }
  return null;
}
