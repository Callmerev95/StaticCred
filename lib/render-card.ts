// Satu sumber render kartu review untuk preview dan export.
// Semua koordinat dalam piksel export, satuan turunan u = tw/100. Nilai
// diukur dari piksel mockup acuan.
// Cabang landscape (pvc-h) dua kolom, cabang portrait (lainnya) kolom tengah.
// Lihat ADR-0002, CONTEXT.md, DESIGN.md § Card Themes.
import qrcode from "qrcode-generator";
import { BLEED_MM, mmToPx } from "./sizes";
import {
  getCardTheme,
  QR_STRIP_STOPS,
  VERIFIED_LABEL,
  type CardTheme,
  type CardThemeId,
} from "./card-themes";

export const QR_ECC = "H" as const;
export const QR_QUIET_MODULES = 4;
export const QR_VERSION_WARN = 10;
export const CARD_RADIUS_FACTOR = 0.07;
export const PORTRAIT_QR_WIDTH_FACTOR = 0.72;
export const HEADER_SCALE = 1.08;

export interface CardTexts {
  title?: string;
  badge?: string;
  cta?: string;
  subCta?: string;
}

export interface DrawCardOpts {
  widthPx: number;
  heightPx: number;
  businessName: string;
  qrPayload: string;
  cardTheme?: CardThemeId;
  showStars?: boolean;
  showNfc?: boolean;
  showSerial?: boolean;
  cardId?: string;
  bleed?: boolean;
  texts?: CardTexts;
  logo?: HTMLImageElement | null;
}

export interface QrInfo {
  moduleCount: number;
  version: number;
  tooDense: boolean;
}

const DEFAULT_TEXTS: Required<CardTexts> = {
  title: "Beri Ulasan di Google",
  badge: "GOOGLE REVIEW",
  cta: "SCAN ATAU TAP DI SINI",
  subCta:
    "Scan QR code atau dekatkan HP (NFC) untuk membagikan pengalaman terbaik Anda bersama kami.",
};

const FONT_STACK =
  'Inter, Geist, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function buildQr(payload: string) {
  const qr = qrcode(0, QR_ECC);
  qr.addData(payload);
  qr.make();
  return qr;
}

// Versi QR dibaca dari objek QR untuk warning PRD (versi > 10).
export function getQrInfo(payload: string): QrInfo {
  const moduleCount = buildQr(payload).getModuleCount();
  const version = Math.round((moduleCount - 17) / 4);
  return { moduleCount, version, tooDense: version > QR_VERSION_WARN };
}

function traceRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.max(1, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  traceRoundRect(ctx, x, y, w, h, r);
  ctx.fill();
}

function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  traceRoundRect(ctx, x, y, w, h, r);
  ctx.stroke();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + rad * Math.cos(a);
    const y = cy + rad * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

// Badge G official, path persis dari @lobehub/icons Google.Color (MIT,
// viewBox 24). Digambar via Path2D agar tajam di 300 DPI.
export const GOOGLE_G_PATHS: Array<{ d: string; fill: string }> = [
  {
    d: "M23 12.245c0-.905-.075-1.565-.236-2.25h-10.54v4.083h6.186c-.124 1.014-.797 2.542-2.294 3.569l-.021.136 3.332 2.53.23.022C21.779 18.417 23 15.593 23 12.245z",
    fill: "#4285F4",
  },
  {
    d: "M12.225 23c3.03 0 5.574-.978 7.433-2.665l-3.542-2.688c-.948.648-2.22 1.1-3.891 1.1a6.745 6.745 0 01-6.386-4.572l-.132.011-3.465 2.628-.045.124C4.043 20.531 7.835 23 12.225 23z",
    fill: "#34A853",
  },
  {
    d: "M5.84 14.175A6.65 6.65 0 015.463 12c0-.758.138-1.491.361-2.175l-.006-.147-3.508-2.67-.115.054A10.831 10.831 0 001 12c0 1.772.436 3.447 1.197 4.938l3.642-2.763z",
    fill: "#FBBC05",
  },
  {
    d: "M12.225 5.253c2.108 0 3.529.892 4.34 1.638l3.167-3.031C17.787 2.088 15.255 1 12.225 1 7.834 1 4.043 3.469 2.197 7.062l3.63 2.763a6.77 6.77 0 016.398-4.572z",
    fill: "#EB4335",
  },
];

export function drawGoogleG(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  const Path2DCtor = (
    globalThis as unknown as { Path2D?: new (d: string) => Path2D }
  ).Path2D;
  if (typeof Path2DCtor === "undefined") {
    drawGoogleGFallback(ctx, cx, cy, r);
    return;
  }
  const s = (r * 2) / 24;
  ctx.save();
  ctx.translate(cx - s * 12, cy - s * 12);
  ctx.scale(s, s);
  for (const { d, fill } of GOOGLE_G_PATHS) {
    ctx.fillStyle = fill;
    ctx.fill(new Path2DCtor(d));
  }
  ctx.restore();
}

// Aproksimasi busur bila Path2D tak tersedia (di luar browser).
export const GOOGLE_G_COLORS = {
  blue: "#4285F4",
  red: "#EB4335",
  yellow: "#FBBC05",
  green: "#34A853",
} as const;

function drawGoogleGFallback(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  const rr = r * 0.62;
  ctx.lineWidth = Math.max(1, Math.round(r * 0.4));
  ctx.lineCap = "butt";
  const arcs: Array<[number, number, string]> = [
    [-0.28 * Math.PI, 0.28 * Math.PI, GOOGLE_G_COLORS.blue],
    [0.28 * Math.PI, 0.72 * Math.PI, GOOGLE_G_COLORS.green],
    [0.72 * Math.PI, 0.86 * Math.PI, GOOGLE_G_COLORS.yellow],
    [0.86 * Math.PI, 1.72 * Math.PI, GOOGLE_G_COLORS.red],
  ];
  for (const [start, end, color] of arcs) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, start, end);
    ctx.stroke();
  }
  ctx.fillStyle = GOOGLE_G_COLORS.blue;
  const lw = ctx.lineWidth;
  ctx.fillRect(cx - lw * 0.1, cy - lw / 2, rr + lw * 0.6, lw);
}

// Ikon contactless untuk pill TAP NFC: 4 busur sepusat membuka ke kanan.
// Kontur diambil dari artwork Flaticon (Contactless, ID 6107543) berukuran 512px:
// pusat busur di (61, 256), radius 68/159/250/341 (jarak 91), setengah sudut 45°,
// tebal garis 31, round cap. Di sini dikunci lewat d: pusat busur geser
// (61-256)·d/512 ke kiri dari pusat glyph agar ink tetap center di (cx, cy).
export function drawContactlessGlyph(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  d: number,
  color: string,
): void {
  const k = d / 512;
  const step = 91 * k;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, 31 * k);
  ctx.lineCap = "round";
  // beginPath per busur: arc() menyambung titik akhir subpath sebelumnya
  // ke awal busur berikutnya, bikin garis diagonal menempel.
  for (const r of [68 * k, 68 * k + step, 68 * k + step * 2, 68 * k + step * 3]) {
    ctx.beginPath();
    ctx.arc(cx - 195 * k, cy, r, -Math.PI / 4, Math.PI / 4);
    ctx.stroke();
  }
  ctx.restore();
}

function setFont(
  ctx: CanvasRenderingContext2D,
  weight: number,
  sizePx: number,
): void {
  ctx.font = `${weight} ${sizePx}px ${FONT_STACK}`;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  let truncated = false;
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (!line || ctx.measureText(t).width <= maxWidth) {
      line = t;
    } else if (lines.length + 1 >= maxLines) {
      truncated = true;
      break;
    } else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  if (truncated && lines.length > 0) {
    const last = lines[lines.length - 1];
    let cut = last;
    while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) {
      cut = cut.slice(0, -1);
    }
    lines[lines.length - 1] = `${cut}…`;
  }
  return lines.slice(0, maxLines);
}

function truncateSingle(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut}…`;
}

interface QrBox {
  cell: number;
  originX: number;
  originY: number;
}

// Modul digabung dalam satu Path2D + sekali fill agar full-res 300 DPI tetap cepat.
function drawQrModules(
  ctx: CanvasRenderingContext2D,
  qr: ReturnType<typeof buildQr>,
  box: QrBox,
  fg: string,
): void {
  const n = qr.getModuleCount();
  ctx.fillStyle = fg;
  const Path2DCtor = (
    globalThis as unknown as { Path2D?: new () => Path2D }
  ).Path2D;
  if (typeof Path2DCtor !== "undefined") {
    const path = new Path2DCtor();
    for (let r = 0; r < n; r += 1) {
      for (let c = 0; c < n; c += 1) {
        if (qr.isDark(r, c)) {
          path.rect(box.originX + c * box.cell, box.originY + r * box.cell, box.cell, box.cell);
        }
      }
    }
    ctx.fill(path);
    return;
  }
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if (qr.isDark(r, c)) {
        ctx.fillRect(
          box.originX + c * box.cell,
          box.originY + r * box.cell,
          box.cell,
          box.cell,
        );
      }
    }
  }
}

export interface QrBoxLayout {
  cell: number;
  drawn: number;
  innerPad: number;
  boxW: number;
  ctaSize: number;
  gapCta: number;
  ctaH: number;
  boxH: number;
}

// Geometri panel QR sebagai data murni agar simetri bisa diuji:
// drawn sudah termasuk quiet zone 4 modul di kedua sisi, modul gelap
// selalu inset innerPad + quiet dari tepi panel.
export function qrBoxLayout(
  moduleCount: number,
  availW: number,
  minPad: number,
  u: number,
): QrBoxLayout {
  const totalUnits = moduleCount + QR_QUIET_MODULES * 2;
  const cell = Math.max(1, Math.floor((availW - minPad * 2) / totalUnits));
  const drawn = cell * totalUnits;
  // Padding selalu 2 modul agar QR memenuhi pembungkus (style-barcode.png).
  const innerPad = Math.max(2, cell * 2);
  const boxW = drawn + innerPad * 2;
  const ctaSize = Math.max(Math.round(u * 1.6), Math.round(drawn * 0.078));
  const gapCta = Math.round(innerPad * 1.2);
  const ctaH = Math.round(ctaSize * 1.4);
  const boxH = innerPad + drawn + gapCta + ctaH + innerPad;
  return { cell, drawn, innerPad, boxW, ctaSize, gapCta, ctaH, boxH };
}

export interface QrCardLayout {
  cell: number;
  drawn: number;
  innerPad: number;
  panelW: number;
  padX: number;
  stripH: number;
  gapTop: number;
  gapPill: number;
  ctaSize: number;
  ctaH: number;
  bottomPad: number;
  cardW: number;
  cardH: number;
}

// Geometri kartu QR penuh (strip pelangi + panel + pill CTA), diukur dari
// mockup: padX 2,15u, strip 0,75u, gap panel-atas 1,5u, gap pill 1,85u,
// pill 4,3u, dasar 1,85u. cell dijepit lebar DAN tinggi zona yang tersedia.
// exactStride: pakai stride nyata panel (total + 4 modul innerPad) agar sel
// memakai lebar/tinggi avail penuh; cabang lama (pvc-h) tetap memakai stride
// konservatif total + 2·quiet agar hasil pvc-h tak berubah.
export function qrCardLayout(
  moduleCount: number,
  availCardW: number,
  availCardH: number,
  u: number,
  exactStride = false,
): QrCardLayout {
  const padX = Math.round(u * 2.15);
  const stripH = Math.max(2, Math.round(u * 0.75));
  const gapTop = Math.round(u * 1.5);
  const gapPill = Math.round(u * 1.85);
  const ctaH = Math.round(u * 4.3);
  const bottomPad = Math.round(u * 1.85);
  const fixedH = stripH + gapTop + gapPill + ctaH + bottomPad;
  const total = moduleCount + QR_QUIET_MODULES * 2;
  // Panel = drawn + innerPad (2 modul tiap sisi) → stride total + 4.
  const withPad = exactStride ? total + 4 : total + QR_QUIET_MODULES * 2;
  const cellW = Math.floor((availCardW - padX * 2) / withPad);
  const cellH = Math.floor((availCardH - fixedH) / withPad);
  const cell = Math.max(1, Math.min(cellW, cellH));
  const drawn = cell * total;
  const innerPad = Math.max(2, cell * 2);
  const panelW = drawn + innerPad * 2;
  const ctaSize = Math.max(Math.round(u * 1.45), Math.round(drawn * 0.06));
  const cardW = panelW + padX * 2;
  const cardH = stripH + gapTop + panelW + gapPill + ctaH + bottomPad;
  return {
    cell,
    drawn,
    innerPad,
    panelW,
    padX,
    stripH,
    gapTop,
    gapPill,
    ctaSize,
    ctaH,
    bottomPad,
    cardW,
    cardH,
  };
}

// Bracket L di empat sudut panel, di dalam quiet zone agar tak menutup modul.
function drawQrBrackets(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  u: number,
  maxExtent: number,
): void {
  const lw = Math.max(2, Math.round(u * 0.3));
  const inset = Math.max(2, Math.round(u * 0.85));
  const room = maxExtent - inset - lw;
  const arm = Math.round(u * 1.85);
  if (room < Math.min(arm, u * 0.6)) return;
  const a = Math.min(arm, room);
  const x1 = x + inset;
  const y1 = y + inset;
  const x2 = x + w - inset;
  const y2 = y + w - inset;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x1 + a, y1);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x1, y1 + a);
  ctx.moveTo(x2 - a, y1);
  ctx.lineTo(x2, y1);
  ctx.lineTo(x2, y1 + a);
  ctx.moveTo(x2, y2 - a);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2 - a, y2);
  ctx.moveTo(x1, y2 - a);
  ctx.lineTo(x1, y2);
  ctx.lineTo(x1 + a, y2);
  ctx.stroke();
  ctx.restore();
}

// Chip putih di tengah panel: default berisi logo G, atau logo user bila ada.
// Sisi 5 modul (mockup) dan di bawah ambang 8 modul agar QR tetap terbaca.
function drawCenterLogo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cell: number,
  u: number,
  logo: HTMLImageElement | null,
): void {
  const side = Math.max(Math.round(cell * 5), Math.round(u * 3));
  ctx.fillStyle = "#FFFFFF";
  fillRoundRect(
    ctx,
    Math.round(cx - side / 2),
    Math.round(cy - side / 2),
    side,
    side,
    Math.round(side * 0.24),
  );
  if (logo && logo.naturalWidth > 0 && logo.naturalHeight > 0) {
    const box = side * 0.72;
    const scale = Math.min(box / logo.naturalWidth, box / logo.naturalHeight);
    const dw = logo.naturalWidth * scale;
    const dh = logo.naturalHeight * scale;
    ctx.drawImage(logo, Math.round(cx - dw / 2), Math.round(cy - dh / 2), dw, dh);
    return;
  }
  drawGoogleG(ctx, cx, cy, side * 0.3);
}

// Badge centang setelah label "Google Verified". Siluet 10 lobus dipetakan dari
// Flaticon ID 7641727 (lisensi Flaticon, atribusi README): polar r = R·(a + b·cos10θ)
// dengan a/b diukur dari artwork 512 px, plus centang putih dua segmen round-cap.
function drawCheckBadge(
  ctx: CanvasRenderingContext2D,
  color: string,
  cx: number,
  cy: number,
  d: number,
): void {
  const R = d / 2;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const steps = 80;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const rr = R * (0.9063 + 0.0937 * Math.cos(10 * t));
    const x = cx + rr * Math.cos(t);
    const y = cy + rr * Math.sin(t);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = Math.max(1.5, d * 0.0653);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - d * 0.1383, cy - d * 0.012);
  ctx.lineTo(cx - d * 0.0425, cy + d * 0.0926);
  ctx.lineTo(cx + d * 0.1383, cy - d * 0.0468);
  ctx.stroke();
  ctx.restore();
}

// Kartu QR: bayangan + isi, strip pelangi, panel, modul, bracket, logo
// center, pill CTA teks center. Mengembalikan ukuran kartu.
function drawQrCard(
  ctx: CanvasRenderingContext2D,
  theme: CardTheme,
  qr: ReturnType<typeof buildQr>,
  cardX: number,
  cardY: number,
  lay: QrCardLayout,
  cta: string,
  logo: HTMLImageElement | null,
  u: number,
): { cardW: number; cardH: number } {
  const r = Math.max(4, Math.round(lay.cardW * 0.065));
  ctx.save();
  if (theme.qrCardShadow) {
    ctx.shadowColor = theme.qrCardShadow;
    ctx.shadowBlur = Math.round(lay.cardW * 0.045);
    ctx.shadowOffsetY = Math.round(lay.cardW * 0.018);
  }
  ctx.fillStyle = theme.qrCardBg;
  fillRoundRect(ctx, cardX, cardY, lay.cardW, lay.cardH, r);
  ctx.restore();

  ctx.save();
  traceRoundRect(ctx, cardX, cardY, lay.cardW, lay.cardH, r);
  ctx.clip();
  const grad = ctx.createLinearGradient(cardX, 0, cardX + lay.cardW, 0);
  for (const [stop, color] of QR_STRIP_STOPS) grad.addColorStop(stop, color);
  ctx.fillStyle = grad;
  ctx.fillRect(cardX, cardY, lay.cardW, lay.stripH);
  if (theme.qrCardBorder) {
    ctx.strokeStyle = theme.qrCardBorder;
    ctx.lineWidth = Math.max(2, Math.round(lay.cardW * 0.008));
    strokeRoundRect(ctx, cardX, cardY, lay.cardW, lay.cardH, r);
  }
  ctx.restore();

  const panelX = cardX + lay.padX;
  const panelY = cardY + lay.stripH + lay.gapTop;
  ctx.fillStyle = theme.qrPanel;
  fillRoundRect(
    ctx,
    panelX,
    panelY,
    lay.panelW,
    lay.panelW,
    Math.round(lay.panelW * 0.06),
  );

  const quiet = QR_QUIET_MODULES * lay.cell;
  drawQrModules(
    ctx,
    qr,
    {
      cell: lay.cell,
      originX: panelX + lay.innerPad + quiet,
      originY: panelY + lay.innerPad + quiet,
    },
    theme.qrFg,
  );
  drawQrBrackets(
    ctx,
    theme.qrAccent,
    panelX,
    panelY,
    lay.panelW,
    u,
    lay.innerPad + quiet,
  );
  drawCenterLogo(
    ctx,
    panelX + lay.panelW / 2,
    panelY + lay.panelW / 2,
    lay.cell,
    u,
    logo,
  );

  const pillY = panelY + lay.panelW + lay.gapPill;
  const pillCx = panelX + lay.panelW / 2;
  const pillCy = Math.round(pillY + lay.ctaH / 2);
  ctx.fillStyle = theme.ctaBg;
  fillRoundRect(ctx, panelX, pillY, lay.panelW, lay.ctaH, lay.ctaH / 2);

  // Konten [label] dipusatkan dalam pill.
  const sidePad = Math.round(u * 1.2);
  const labelRoom = lay.panelW - sidePad * 2;
  ctx.fillStyle = theme.ctaFg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Perkecil font dulu agar label utuh; potong hanya sebagai jaring pengaman.
  let ctaSize = lay.ctaSize;
  setFont(ctx, 700, ctaSize);
  const minCtaSize = Math.max(8, Math.round(ctaSize * 0.6));
  while (ctaSize > minCtaSize && ctx.measureText(cta).width > labelRoom) {
    ctaSize -= 1;
    setFont(ctx, 700, ctaSize);
  }
  const label = truncateSingle(ctx, cta, labelRoom);
  ctx.fillText(label, pillCx, pillCy);
  return { cardW: lay.cardW, cardH: lay.cardH };
}

// Deret bintang + skor "5.0". alignLeft: x = titik awal; selain itu x = pusat.
function drawStarsRow(
  ctx: CanvasRenderingContext2D,
  theme: CardTheme,
  x: number,
  cy: number,
  starR: number,
  gapStar: number,
  gapRating: number,
  ratingSize: number,
  alignLeft: boolean,
): number {
  ctx.save();
  setFont(ctx, 700, ratingSize);
  const ratingW = ctx.measureText("5.0").width;
  const starsW = Math.round(5 * starR * 2 + 4 * gapStar);
  const totalW = starsW + gapRating + ratingW;
  const x0 = alignLeft ? x : x - totalW / 2;
  ctx.fillStyle = theme.star;
  ctx.textBaseline = "middle";
  for (let i = 0; i < 5; i += 1) {
    drawStar(ctx, x0 + starR + i * (starR * 2 + gapStar), cy, starR);
  }
  ctx.fillStyle = theme.heading;
  ctx.textAlign = "left";
  ctx.fillText("5.0", x0 + starsW + gapRating, cy);
  ctx.restore();
  return totalW;
}

// Baris brand footer: "Powered by " + "StaticCred" tebal + " Card System".
function drawPoweredBy(
  ctx: CanvasRenderingContext2D,
  theme: CardTheme,
  x: number,
  cy: number,
  u: number,
  center: boolean,
): void {
  const fs = Math.round(u * 1.45);
  const p1 = "Powered by ";
  const p2 = "StaticCred";
  const p3 = " Card System";
  ctx.textBaseline = "middle";
  setFont(ctx, 500, fs);
  const w1 = ctx.measureText(p1).width;
  setFont(ctx, 700, fs);
  const w2 = ctx.measureText(p2).width;
  setFont(ctx, 500, fs);
  const w3 = ctx.measureText(p3).width;
  const x0 = center ? x - (w1 + w2 + w3) / 2 : x - (w1 + w2 + w3);
  ctx.textAlign = "left";
  ctx.fillStyle = theme.poweredBase;
  ctx.fillText(p1, x0, cy);
  setFont(ctx, 700, fs);
  ctx.fillStyle = theme.poweredBrand;
  ctx.fillText(p2, x0 + w1, cy);
  setFont(ctx, 500, fs);
  ctx.fillStyle = theme.poweredBase;
  ctx.fillText(p3, x0 + w1 + w2, cy);
}

function drawCropMarks(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  inset: number,
  color: string,
): void {
  const len = Math.round(inset * 0.9);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  const corners: Array<[number, number, number, number]> = [
    [inset, inset, 1, 1],
    [w - inset, inset, -1, 1],
    [inset, h - inset, 1, -1],
    [w - inset, h - inset, -1, -1],
  ];
  ctx.beginPath();
  for (const [x, y, dx, dy] of corners) {
    ctx.moveTo(x + dx * len, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * len);
  }
  ctx.stroke();
}

interface CardFrame {
  tx: number;
  ty: number;
  tw: number;
  th: number;
  u: number;
  pad: number;
  left: number;
  right: number;
}

interface HeaderGeom {
  headerBottom: number;
}

// Header: chip squircle berisi G, dua baris label ("Google Verified" +
// badge centang / badge teks), pill TAP NFC kanan, hairline dasar.
function drawHeader(
  ctx: CanvasRenderingContext2D,
  theme: CardTheme,
  f: CardFrame,
  texts: Required<CardTexts>,
  showNfc: boolean,
): HeaderGeom {
  const { u, pad, ty, left, right } = f;
  // Unit header 8% lebih besar dari u agar chip, font, ikon, dan pill
  // tampil sedikit lebih besar merata di semua ukuran kartu.
  const hu = u * HEADER_SCALE;
  const chipD = Math.round(hu * 5.4);
  const headerCy = ty + pad + chipD / 2;
  const chipX = left;
  const chipY = Math.round(headerCy - chipD / 2);
  const chipR = Math.round(chipD * 0.28);
  ctx.save();
  if (theme.chipShadow) {
    ctx.shadowColor = "rgba(17,23,41,0.14)";
    ctx.shadowBlur = Math.round(hu * 1.2);
    ctx.shadowOffsetY = Math.round(hu * 0.4);
  }
  ctx.fillStyle = theme.chipBg;
  fillRoundRect(ctx, chipX, chipY, chipD, chipD, chipR);
  ctx.restore();
  if (theme.chipBorder) {
    ctx.strokeStyle = theme.chipBorder;
    ctx.lineWidth = Math.max(1, Math.round(hu * 0.14));
    strokeRoundRect(ctx, chipX, chipY, chipD, chipD, chipR);
  }
  drawGoogleG(ctx, chipX + chipD / 2, headerCy, chipD * 0.305);

  // Geometri pill NFC dulu: teks kiri memakai tepi kirinya sebagai batas.
  const fsNfc = Math.round(hu * 1.4);
  setFont(ctx, 700, fsNfc);
  const iconD = Math.round(hu * 1.7);
  const gapIcon = Math.round(hu * 0.55);
  const pillPadX = Math.round(hu * 1.9);
  const nfcLabel = "TAP NFC";
  const pillW = Math.round(iconD + gapIcon + ctx.measureText(nfcLabel).width + pillPadX * 2);
  const pillH = Math.round(hu * 4.1);
  const pillX = right - pillW;
  const contentRight = showNfc ? pillX - Math.round(hu * 1.5) : right;

  const fs1 = Math.round(hu * 1.8);
  const fs2 = Math.round(hu * 2.0);
  const lineGap = Math.round(hu * 2.2);
  const line1Cy = headerCy - lineGap / 2;
  const line2Cy = headerCy + lineGap / 2;
  const textX = chipX + chipD + Math.round(hu * 1.5);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  const checkD = Math.round(fs1 * 1.05);
  const checkGap = Math.round(hu * 0.7);
  const line1Room = Math.max(
    10,
    contentRight - textX - checkD - checkGap - Math.round(hu * 1),
  );
  setFont(ctx, 600, fs1);
  ctx.fillStyle = theme.verified;
  const verified = truncateSingle(ctx, VERIFIED_LABEL, line1Room);
  ctx.fillText(verified, textX, line1Cy);
  // Badge rata bawah baseline teks "Google Verified" (bukan tengah cap):
  // tepi bawah badge = baseline, dengan baseline dihitung dari middle + 0.31·fs1.
  const baseY = line1Cy + Math.round(fs1 * 0.31);
  drawCheckBadge(
    ctx,
    theme.qrAccent,
    textX + ctx.measureText(verified).width + checkGap + checkD / 2,
    baseY - Math.round(checkD / 2),
    checkD,
  );

  setFont(ctx, 700, fs2);
  ctx.fillStyle = theme.badgeFg;
  ctx.fillText(
    truncateSingle(ctx, texts.badge, Math.max(10, contentRight - textX)),
    textX,
    line2Cy,
  );

  if (showNfc) {
    ctx.fillStyle = theme.pillBg;
    fillRoundRect(ctx, pillX, Math.round(headerCy - pillH / 2), pillW, pillH, pillH / 2);
    if (theme.pillBorder) {
      ctx.strokeStyle = theme.pillBorder;
      ctx.lineWidth = Math.max(1, Math.round(hu * 0.14));
      strokeRoundRect(ctx, pillX, Math.round(headerCy - pillH / 2), pillW, pillH, pillH / 2);
    }
    drawContactlessGlyph(
      ctx,
      pillX + pillPadX + iconD / 2,
      headerCy,
      iconD,
      theme.nfcIcon,
    );
    setFont(ctx, 700, fsNfc);
    ctx.fillStyle = theme.pillFg;
    ctx.fillText(nfcLabel, pillX + pillPadX + iconD + gapIcon, headerCy);
  }

  const headerBottom = Math.round(ty + pad + chipD + hu * 2.9);
  ctx.strokeStyle = theme.hairline;
  ctx.lineWidth = Math.max(1, Math.round(hu * 0.16));
  ctx.beginPath();
  ctx.moveTo(left, headerBottom);
  ctx.lineTo(right, headerBottom);
  ctx.stroke();
  return { headerBottom };
}

export function drawCard(
  ctx: CanvasRenderingContext2D,
  opts: DrawCardOpts,
): void {
  const W = opts.widthPx;
  const H = opts.heightPx;
  if (!Number.isFinite(W) || !Number.isFinite(H) || W <= 0 || H <= 0) {
    throw new Error("Dimensi kartu tidak valid untuk drawCard.");
  }
  const payload = opts.qrPayload.trim();
  if (!payload) {
    throw new Error("qrPayload kosong, QR butuh URL atau pola /r/G-XXXX.");
  }
  const theme = getCardTheme(opts.cardTheme);
  const showStars = opts.showStars ?? true;
  const showNfc = opts.showNfc ?? true;
  const showSerial = opts.showSerial ?? true;
  const texts = { ...DEFAULT_TEXTS, ...opts.texts };
  const bleedPx = opts.bleed ? mmToPx(BLEED_MM) : 0;
  const logo = opts.logo ?? null;

  const tx = bleedPx;
  const ty = bleedPx;
  const tw = W - bleedPx * 2;
  const th = H - bleedPx * 2;
  const radius = Math.round(Math.min(tw, th) * CARD_RADIUS_FACTOR);

  // Siluet kartu = rounded rect. Tanpa bleed: radius biasa; dengan bleed bentuk
  // luar melebar radius + bleedPx (konsentris dengan garis potong) supaya
  // cakupan 3mm utuh di sudut. Luar busur dibiarkan transparan.
  ctx.save();
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, theme.bgFrom);
  bgGrad.addColorStop(1, theme.bgTo);
  ctx.beginPath();
  traceRoundRect(ctx, 0, 0, W, H, radius + bleedPx);
  ctx.clip();
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);
  // Clip kedua: konten kartu berhenti di garis potong (rounded rect trim).
  ctx.beginPath();
  traceRoundRect(ctx, tx, ty, tw, th, radius);
  ctx.clip();

  const u = tw / 100;
  const pad = Math.round(tw * 0.055);
  const f: CardFrame = {
    tx,
    ty,
    tw,
    th,
    u,
    pad,
    left: tx + pad,
    right: tx + tw - pad,
  };

  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
      "0.04em";
  } catch {
    // letterSpacing opsional, abaikan bila canvas tidak mendukung.
  }

  if (theme.cardBorder) {
    const lw = Math.max(2, Math.round(u * 0.22));
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = lw;
    strokeRoundRect(
      ctx,
      tx + lw / 2,
      ty + lw / 2,
      tw - lw,
      th - lw,
      Math.max(1, radius - lw / 2),
    );
  }

  const header = drawHeader(ctx, theme, f, texts, showNfc);
  const flags: BranchFlags = {
    showStars,
    showSerial,
    payload,
    logo,
  };

  if (tw > th) {
    drawLandscape(ctx, theme, f, header, opts, texts, flags);
  } else {
    drawPortrait(ctx, theme, f, header, opts, texts, flags);
  }

  ctx.restore();

  if (opts.bleed && bleedPx > 0) {
    drawCropMarks(ctx, W, H, bleedPx, theme.muted);
  }
}

interface BranchFlags {
  showStars: boolean;
  showSerial: boolean;
  payload: string;
  logo: HTMLImageElement | null;
}

// pvc-h: dua kolom, hero kiri (eyebrow → judul → bintang → paragraf),
// kartu QR kanan, footer garis + serial kiri + baris brand kanan.
function drawLandscape(
  ctx: CanvasRenderingContext2D,
  theme: CardTheme,
  f: CardFrame,
  header: HeaderGeom,
  opts: DrawCardOpts,
  texts: Required<CardTexts>,
  flags: BranchFlags,
): void {
  const { u, pad, ty, th, left, right } = f;

  const footerTop = Math.round(ty + th - pad - u * 4.1);
  ctx.strokeStyle = theme.hairline;
  ctx.lineWidth = Math.max(1, Math.round(u * 0.16));
  ctx.beginPath();
  ctx.moveTo(left, footerTop);
  ctx.lineTo(right, footerTop);
  ctx.stroke();
  const footerCy = footerTop + Math.round(u * 3.0);
  if (flags.showSerial && opts.cardId) {
    ctx.fillStyle = theme.serial;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    setFont(ctx, 500, Math.round(u * 1.45));
    ctx.fillText(opts.cardId.trim(), left, footerCy);
  }
  drawPoweredBy(ctx, theme, right, footerCy, u, false);

  const midTop = header.headerBottom + Math.round(u * 2);
  const midBottom = footerTop - Math.round(u * 1.5);
  const qr = buildQr(flags.payload);
  const lay = qrCardLayout(
    qr.getModuleCount(),
    Math.round(f.tw * 0.295),
    Math.max(1, midBottom - midTop),
    u,
  );
  const cardX = Math.round(right - lay.cardW);
  const cardY = Math.round(midTop + (midBottom - midTop - lay.cardH) / 2);
  drawQrCard(ctx, theme, qr, cardX, cardY, lay, texts.cta, flags.logo, u);

  // Hero kiri: urutan mockup eyebrow → judul → bintang → paragraf.
  const textX = left;
  const textW = Math.max(10, cardX - Math.round(u * 4) - textX);
  const name = opts.businessName.trim();
  const centerY = cardY + lay.cardH / 2;

  const fsEyebrow = Math.round(u * 1.7);
  const fsHeading = Math.round(u * 4.1);
  const gapEyebrow = Math.round(u * 1.4);
  const gapHeading = Math.round(u * 2.3);
  const gapStars = Math.round(u * 2.1);
  const starsH = Math.round(u * 2.8);
  const lineH = Math.round(u * 2.95);

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  setFont(ctx, 400, Math.round(u * 2.0));
  const paraLines = wrapLines(ctx, texts.subCta, textW, 3);

  let blockH = 0;
  if (name) blockH = fsEyebrow + gapEyebrow;
  blockH += fsHeading;
  if (flags.showStars) blockH += gapHeading + starsH;
  if (paraLines.length > 0) {
    blockH +=
      (flags.showStars ? gapStars : gapHeading) + paraLines.length * lineH;
  }

  let cursorY = centerY - blockH / 2;
  if (name) {
    ctx.fillStyle = theme.muted;
    setFont(ctx, 600, fsEyebrow);
    ctx.fillText(
      truncateSingle(ctx, name, textW),
      textX,
      cursorY + fsEyebrow / 2,
    );
    cursorY += fsEyebrow + gapEyebrow;
  }
  ctx.fillStyle = theme.heading;
  setFont(ctx, 700, fsHeading);
  ctx.fillText(
    truncateSingle(ctx, texts.title, textW),
    textX,
    cursorY + fsHeading / 2,
  );
  cursorY += fsHeading;

  if (flags.showStars) {
    cursorY += gapHeading;
    drawStarsRow(
      ctx,
      theme,
      textX,
      cursorY + starsH / 2,
      Math.round(u * 1.38),
      Math.round(u * 1.25),
      Math.round(u * 3.5),
      Math.round(u * 2.9),
      true,
    );
    cursorY += starsH;
  }

  if (paraLines.length > 0) {
    cursorY += flags.showStars ? gapStars : gapHeading;
    ctx.fillStyle = theme.body;
    setFont(ctx, 400, Math.round(u * 2.0));
    for (let i = 0; i < paraLines.length; i += 1) {
      ctx.fillText(paraLines[i], textX, cursorY + lineH / 2 + i * lineH);
    }
  }
}

// Portrait + persegi: kolom tengah. Hero (eyebrow → judul → bintang → sub-CTA),
// zona QR, lalu footer hairline + satu baris (serial kiri, brand kanan).
// Tinggi blok dihitung dulu; sisa ruang dibagi rata jadi 3 gap header→hero,
// hero→QR, QR→footer (floor 1,5u) agar tak ada zona kosong mengambang.
function drawPortrait(
  ctx: CanvasRenderingContext2D,
  theme: CardTheme,
  f: CardFrame,
  header: HeaderGeom,
  opts: DrawCardOpts,
  texts: Required<CardTexts>,
  flags: BranchFlags,
): void {
  const { u, pad, ty, th, left, right } = f;
  const cx = (left + right) / 2;
  const name = opts.businessName.trim();
  const bottomPad = Math.round(u * 3);

  // Footer: hairline + baris tunggal.
  const brandFs = Math.round(u * 1.45);
  const serialFs = Math.round(u * 1.45);
  const showSerial = flags.showSerial && Boolean(opts.cardId);
  const footerRowH = showSerial ? Math.max(brandFs, serialFs) : brandFs;
  const hairlineGap = Math.round(u * 1.7);
  const footerH = hairlineGap + footerRowH;
  const footerTop = Math.round(ty + th - pad - bottomPad - footerH);
  const footerCy = footerTop + hairlineGap + Math.round(footerRowH / 2);

  const fsEyebrow = Math.round(u * 1.7);
  const fsHeading = Math.round(u * 4.1);
  const gapEyebrow = Math.round(u * 1.4);
  const gapHeading = Math.round(u * 2.3);
  const gapStars = Math.round(u * 2.1);
  const starsH = Math.round(u * 2.8);
  const subLineH = Math.round(u * 2.9);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  setFont(ctx, 400, Math.round(u * 2.0));
  const subLines = wrapLines(ctx, texts.subCta, f.tw - pad * 3, 2);

  let heroH = 0;
  if (name) heroH = fsEyebrow + gapEyebrow;
  heroH += fsHeading;
  if (flags.showStars) heroH += gapHeading + starsH;
  if (subLines.length > 0) {
    heroH += (flags.showStars ? gapStars : gapHeading) + subLines.length * subLineH;
  }

  const gapFloor = Math.round(u * 1.5);
  const contentTop = header.headerBottom;
  const zone = Math.max(1, footerTop - contentTop);
  const availQrH = Math.max(1, zone - heroH - gapFloor * 3);
  const qr = buildQr(flags.payload);
  const lay = qrCardLayout(
    qr.getModuleCount(),
    Math.round(f.tw * PORTRAIT_QR_WIDTH_FACTOR),
    availQrH,
    u,
    true,
  );
  const slack = Math.max(0, zone - heroH - lay.cardH);
  const gap = Math.max(gapFloor, Math.floor(slack / 3));

  const heroTop = contentTop + gap;
  let cursorY = heroTop;
  if (name) {
    ctx.fillStyle = theme.muted;
    setFont(ctx, 600, fsEyebrow);
    ctx.fillText(
      truncateSingle(ctx, name, f.tw - pad * 2),
      cx,
      cursorY + fsEyebrow / 2,
    );
    cursorY += fsEyebrow + gapEyebrow;
  }
  ctx.fillStyle = theme.heading;
  setFont(ctx, 700, fsHeading);
  ctx.fillText(
    truncateSingle(ctx, texts.title, f.tw - pad * 2),
    cx,
    cursorY + fsHeading / 2,
  );
  cursorY += fsHeading;
  if (flags.showStars) {
    cursorY += gapHeading;
    drawStarsRow(
      ctx,
      theme,
      cx,
      cursorY + starsH / 2,
      Math.round(u * 1.38),
      Math.round(u * 1.25),
      Math.round(u * 3.5),
      Math.round(u * 2.9),
      false,
    );
    cursorY += starsH;
  }
  if (subLines.length > 0) {
    cursorY += flags.showStars ? gapStars : gapHeading;
    ctx.fillStyle = theme.body;
    setFont(ctx, 400, Math.round(u * 2.0));
    for (let i = 0; i < subLines.length; i += 1) {
      ctx.fillText(subLines[i], cx, cursorY + subLineH / 2 + i * subLineH);
    }
  }

  const cardX = Math.round(cx - lay.cardW / 2);
  const cardY = Math.round(heroTop + heroH + gap);
  drawQrCard(ctx, theme, qr, cardX, cardY, lay, texts.cta, flags.logo, u);

  ctx.strokeStyle = theme.hairline;
  ctx.lineWidth = Math.max(1, Math.round(u * 0.16));
  ctx.beginPath();
  ctx.moveTo(left, footerTop);
  ctx.lineTo(right, footerTop);
  ctx.stroke();
  if (showSerial && opts.cardId) {
    ctx.fillStyle = theme.serial;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    setFont(ctx, 500, serialFs);
    ctx.fillText(opts.cardId.trim(), left, footerCy);
  }
  drawPoweredBy(ctx, theme, right, footerCy, u, false);
}

