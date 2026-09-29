// Export PNG + PDF 300 DPI siap cetak. PNG: dimensi piksel persis tabel PRD.
// PDF: unit mm + ukuran custom + embed PNG 1:1 (bukan raster ulang).
// Lihat PRD.md S5-S6, ADR-0001.
import { jsPDF } from "jspdf";
import { drawCard, type DrawCardOpts } from "./render-card";
import { BLEED_MM, exportDims, type CardSize } from "./sizes";
import type { CardFormState } from "./form-state";

// Ambang peringatan payload agar QR tetap terbaca di cetak 1:1.
export const QR_PAYLOAD_WARN_LEN = 200;

// Opsi gambar dari state form + payload terdebounce. Satu sumber untuk
// preview (#6) dan export agar keduanya tidak pernah drift.
export function exportDrawOpts(
  form: CardFormState,
  qrPayload: string,
  dims: { widthPx: number; heightPx: number },
): DrawCardOpts {
  const t = form.texts;
  return {
    widthPx: dims.widthPx,
    heightPx: dims.heightPx,
    businessName: form.businessName,
    qrPayload,
    cardTheme: form.cardTheme,
    showStars: form.showStars,
    showNfc: form.showNfc,
    showSerial: form.showSerial,
    cardId: form.cardId,
    bleed: form.bleed,
    texts: {
      ...(t.title ? { title: t.title } : {}),
      ...(t.badge ? { badge: t.badge } : {}),
      ...(t.cta ? { cta: t.cta } : {}),
      ...(t.subCta ? { subCta: t.subCta } : {}),
    },
  };
}

export function exportFileName(
  sizeId: string,
  cardTheme: string,
  bleed: boolean,
  ext: "png" | "pdf",
): string {
  return `staticcred-${sizeId}-${cardTheme}${bleed ? "-bleed" : ""}.${ext}`;
}

// Ukuran halaman PDF: tambah bleed 3 mm tiap sisi bila aktif.
export function pdfSizeMm(
  size: CardSize,
  bleed: boolean,
): { widthMm: number; heightMm: number } {
  if (!bleed) return { widthMm: size.widthMm, heightMm: size.heightMm };
  return {
    widthMm: size.widthMm + BLEED_MM * 2,
    heightMm: size.heightMm + BLEED_MM * 2,
  };
}

export function renderOffscreen(opts: DrawCardOpts): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = opts.widthPx;
  canvas.height = opts.heightPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D tidak tersedia di browser ini.");
  drawCard(ctx, opts);
  return canvas;
}

// Piksel export dicek di sini: canvas menolak ukuran non-integer, dan
// dimensi selalu dari exportDims agar persis tabel PRD.
export function assertExportDims(
  size: CardSize,
  bleed: boolean,
  canvas: { width: number; height: number },
): void {
  const d = exportDims(size, bleed);
  if (canvas.width !== d.widthPx || canvas.height !== d.heightPx) {
    throw new Error(
      `Dimensi PNG ${canvas.width}x${canvas.height} tidak cocok ${d.widthPx}x${d.heightPx}.`,
    );
  }
}

// PDF presisi mm: format custom + gambar penuhi halaman 1:1.
export function makePdf(
  pngDataUrl: string,
  widthMm: number,
  heightMm: number,
): jsPDF {
  const pdf = new jsPDF({
    unit: "mm",
    format: [widthMm, heightMm],
    orientation: widthMm >= heightMm ? "landscape" : "portrait",
    compress: true,
  });
  pdf.addImage(pngDataUrl, "PNG", 0, 0, widthMm, heightMm);
  return pdf;
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
