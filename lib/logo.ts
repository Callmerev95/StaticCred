// Upload logo untuk kolom tengah QR. Hanya data URL di state form;
// tidak pernah dikirim ke KV (lihat ADR). Ekspor menunggu gambar termuat
// agar preview dan PNG identik.

export const LOGO_MAX_BYTES = 1024 * 1024;
export const LOGO_ACCEPT = "image/png,image/jpeg,image/webp";

const cache = new Map<string, HTMLImageElement>();

// Pesan validasi untuk file yang ditolak, null bila lolos.
export function logoFileError(file: File): string | null {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    return "Format harus PNG, JPG, atau WebP.";
  }
  if (file.size > LOGO_MAX_BYTES) {
    return "Ukuran logo maksimal 1 MB.";
  }
  return null;
}

// Muat logo dari data URL; null untuk input kosong/gagal (fallback logo G).
export function loadCardLogo(dataUrl: string): Promise<HTMLImageElement | null> {
  if (!dataUrl.startsWith("data:image/")) return Promise.resolve(null);
  const hit = cache.get(dataUrl);
  if (hit) return Promise.resolve(hit);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      cache.set(dataUrl, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}
