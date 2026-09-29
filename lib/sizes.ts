// Tabel ukuran cetak + matematika DPI. Satu sumber untuk preview, badge,
// footer piksel, dan export. Lihat PRD.md S3, CONTEXT.md (pixel math).

export const DPI = 300;
export const MM_PER_INCH = 25.4;
export const BLEED_MM = 3;

export type SizeId = "pvc-h" | "pvc-v" | "a6" | "a7" | "stiker-70";

export interface CardSize {
  id: SizeId;
  label: string;
  widthMm: number;
  heightMm: number;
  widthPx: number;
  heightPx: number;
}

export function mmToPx(mm: number, dpi: number = DPI): number {
  return Math.round((mm * dpi) / MM_PER_INCH);
}

function define(
  id: SizeId,
  label: string,
  widthMm: number,
  heightMm: number,
): CardSize {
  return {
    id,
    label,
    widthMm,
    heightMm,
    widthPx: mmToPx(widthMm),
    heightPx: mmToPx(heightMm),
  };
}

export const CARD_SIZES: CardSize[] = [
  define("pvc-h", "PVC Horizontal", 85.6, 54),
  define("pvc-v", "PVC Vertikal", 54, 85.6),
  define("a6", "Standee A6", 105, 148),
  define("a7", "Standee A7", 74, 105),
  define("stiker-70", "Stiker Kasir", 70, 70),
];

export function getSize(id: SizeId): CardSize {
  const found = CARD_SIZES.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown size id: ${id}`);
  return found;
}

export interface ExportDims {
  widthPx: number;
  heightPx: number;
}

// Dimensi export. Bleed menambah 3 mm tiap sisi (lihat ADR-0002).
export function exportDims(size: CardSize, bleed: boolean): ExportDims {
  if (!bleed) return { widthPx: size.widthPx, heightPx: size.heightPx };
  return {
    widthPx: mmToPx(size.widthMm + BLEED_MM * 2),
    heightPx: mmToPx(size.heightMm + BLEED_MM * 2),
  };
}

// "1011 × 638 px @ 300 DPI" untuk badge preview.
export function dimensionBadge(size: CardSize): string {
  return `${size.widthPx} × ${size.heightPx} px @ ${DPI} DPI`;
}

// "1082 × 709 px (+bleed 3mm)" untuk footer preview.
export function outputSummary(size: CardSize, bleed: boolean): string {
  const d = exportDims(size, bleed);
  const suffix = bleed ? ` (+bleed ${BLEED_MM}mm)` : "";
  return `Output Piksel: ${d.widthPx} × ${d.heightPx} px${suffix}`;
}
