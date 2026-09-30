// Satu sumber render kartu review untuk preview dan export.
// Semua koordinat dalam piksel export. Cabang landscape (pvc-h) dua kolom,
// cabang portrait (lainnya) kolom tengah. Lihat ADR-0002, CONTEXT.md,
// reference/stitch-reference.png + reference/*.png per ukuran.
import qrcode from "qrcode-generator";
import { BLEED_MM, mmToPx } from "./sizes";
import { getCardTheme, type CardTheme, type CardThemeId } from "./card-themes";

export const QR_ECC = "H" as const;
export const QR_QUIET_MODULES = 4;
export const QR_VERSION_WARN = 10;
export const CARD_RADIUS_FACTOR = 0.07;
export const PORTRAIT_QR_WIDTH_FACTOR = 0.56;

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
  subCta: "Scan QR atau tap kartu untuk beri review",
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

// Badge G multicolor official untuk tema google. Empat busur + bilah biru,
// digambar vector agar tajam di 300 DPI. Lihat DESIGN.md § Card Themes.
export const GOOGLE_G_COLORS = {
  blue: "#4285F4",
  red: "#EA4335",
  yellow: "#FBBC05",
  green: "#34A853",
} as const;

export function drawGoogleG(
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

// Ikon wifi untuk pill TAP NFC: titik + dua busur membuka ke atas.
export function drawWifiGlyph(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.4, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  for (const k of [0.55, 0.95]) {
    ctx.arc(cx, cy + r * 0.4, r * k, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();
  }
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

interface QrMeasure {
  cell: number;
  drawn: number;
  innerPad: number;
  boxW: number;
}

function measureQrBox(
  qr: ReturnType<typeof buildQr>,
  availW: number,
  minPad: number,
): QrMeasure {
  const n = qr.getModuleCount();
  const totalUnits = n + QR_QUIET_MODULES * 2;
  const cell = Math.max(1, Math.floor((availW - minPad * 2) / totalUnits));
  const drawn = cell * totalUnits;
  const innerPad = Math.max(cell * 2, minPad);
  const boxW = drawn + innerPad * 2;
  return { cell, drawn, innerPad, boxW };
}

// Tinggi box = pad atas + modul + gap + strip CTA + pad bawah.
function qrBoxHeight(m: QrMeasure, ctaSize: number): number {
  const gapCta = Math.round(m.innerPad * 1.2);
  const ctaH = Math.round(ctaSize * 1.4);
  return m.innerPad + m.drawn + gapCta + ctaH + m.innerPad;
}

// Ukuran font CTA proporsional modul: teks selebar QR (style-barcode.png).
function ctaFontSize(m: QrMeasure, u: number): number {
  return Math.max(Math.round(u * 1.6), Math.round(m.drawn * 0.078));
}

// Kotak QR putih + modul center + CTA di dalam box pas di bawah QR.
// Proporsi mengikuti style-barcode.png. Tanpa caption versi ECC.
function drawQrBox(
  ctx: CanvasRenderingContext2D,
  theme: CardTheme,
  qr: ReturnType<typeof buildQr>,
  boxX: number,
  boxY: number,
  m: QrMeasure,
  cta: string,
  ctaSize: number,
): { boxW: number; boxH: number } {
  const gapCta = Math.round(m.innerPad * 1.2);
  const ctaH = Math.round(ctaSize * 1.4);
  const boxH = qrBoxHeight(m, ctaSize);
  const radius = Math.round(m.boxW * 0.11);
  ctx.fillStyle = theme.qrBg;
  fillRoundRect(ctx, boxX, boxY, m.boxW, boxH, radius);
  if (theme.qrBoxBorder) {
    ctx.strokeStyle = theme.qrBoxBorder;
    ctx.lineWidth = Math.max(1, Math.round(m.cell / 3));
    strokeRoundRect(ctx, boxX, boxY, m.boxW, boxH, radius);
  }
  drawQrModules(
    ctx,
    qr,
    { cell: m.cell, originX: boxX + m.innerPad, originY: boxY + m.innerPad },
    theme.qrFg,
  );
  ctx.fillStyle = theme.ctaInBox;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  setFont(ctx, 700, ctaSize);
  ctx.fillText(
    truncateSingle(ctx, cta, m.boxW - m.innerPad),
    boxX + m.boxW / 2,
    boxY + m.innerPad + m.drawn + gapCta + ctaH / 2,
  );
  return { boxW: m.boxW, boxH };
}

function drawStarsRow(
  ctx: CanvasRenderingContext2D,
  theme: CardTheme,
  cx: number,
  cy: number,
  starR: number,
  ratingSize: number,
  showStars: boolean,
): number {
  if (!showStars) return 0;
  const gap = Math.round(starR * 0.6);
  ctx.fillStyle = theme.star;
  ctx.textBaseline = "middle";
  setFont(ctx, 700, ratingSize);
  const ratingW = ctx.measureText("5.0").width;
  const totalW = 5 * starR * 2 + 4 * gap + Math.round(starR) + ratingW;
  let x = cx - totalW / 2;
  for (let i = 0; i < 5; i += 1) {
    drawStar(ctx, x + starR, cy, starR);
    x += starR * 2 + gap;
  }
  x += Math.round(starR * 0.4);
  ctx.fillStyle = theme.heading;
  ctx.textAlign = "left";
  ctx.fillText("5.0", x, cy);
  return totalW;
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
  badgeD: number;
  headerCy: number;
  contentRight: number;
}

// Header bersama: badge G + label kiri, pill TAP NFC kanan dengan ikon wifi.
// Teks dan ikon center eksak pada sumbu header.
function drawHeader(
  ctx: CanvasRenderingContext2D,
  theme: CardTheme,
  f: CardFrame,
  texts: Required<CardTexts>,
  showNfc: boolean,
): HeaderGeom {
  const { u, pad, ty, left, right } = f;
  const badgeD = Math.round(u * 5.2);
  const headerCy = ty + pad + badgeD / 2;
  ctx.fillStyle = theme.badgeCircle;
  ctx.beginPath();
  ctx.arc(left + badgeD / 2, headerCy, badgeD / 2, 0, Math.PI * 2);
  ctx.fill();
  if (theme.id === "google") {
    drawGoogleG(ctx, left + badgeD / 2, headerCy, badgeD / 2);
  } else {
    ctx.fillStyle = theme.badgeG;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    setFont(ctx, 700, Math.round(badgeD * 0.58));
    ctx.fillText("G", left + badgeD / 2, headerCy);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const fs = Math.round(u * 1.9);
  setFont(ctx, 600, fs);
  const iconD = Math.round(fs * 1.2);
  const gapIcon = Math.round(fs * 0.5);
  const padX = Math.round(u * 2.2);
  const label = "TAP NFC";
  const labelW = showNfc ? ctx.measureText(label).width : 0;
  const contentW = showNfc ? iconD + gapIcon + labelW : 0;
  const pillW = Math.round(contentW + padX * 2);
  const pillH = Math.round(u * 4.4);
  const contentRight = showNfc ? right - pillW - Math.round(u * 2) : right;

  ctx.fillStyle = theme.badgeFg;
  const badgeX = left + badgeD + Math.round(u * 1.6);
  setFont(ctx, 600, Math.round(u * 2.1));
  ctx.fillText(
    truncateSingle(ctx, texts.badge, Math.max(10, contentRight - badgeX)),
    badgeX,
    headerCy,
  );

  if (showNfc) {
    const pillX = right - pillW;
    ctx.fillStyle = theme.pillBg;
    fillRoundRect(ctx, pillX, Math.round(headerCy - pillH / 2), pillW, pillH, pillH / 2);
    ctx.lineWidth = Math.max(1, Math.round(fs * 0.14));
    drawWifiGlyph(
      ctx,
      pillX + padX + iconD / 2,
      headerCy,
      iconD / 2,
      theme.nfcFg,
    );
    setFont(ctx, 600, fs);
    ctx.fillStyle = theme.nfcFg;
    ctx.textAlign = "left";
    ctx.fillText(label, pillX + padX + iconD + gapIcon, headerCy);
  }
  return { badgeD, headerCy, contentRight };
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

  ctx.save();
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);

  const tx = bleedPx;
  const ty = bleedPx;
  const tw = W - bleedPx * 2;
  const th = H - bleedPx * 2;
  ctx.beginPath();
  traceRoundRect(
    ctx,
    tx,
    ty,
    tw,
    th,
    Math.round(Math.min(tw, th) * CARD_RADIUS_FACTOR),
  );
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

  const header = drawHeader(ctx, theme, f, texts, showNfc);
  const headerBottom = header.headerCy + header.badgeD / 2;

  if (tw > th) {
    drawLandscape(ctx, theme, f, header, opts, texts, {
      showStars,
      showSerial,
      payload,
    });
  } else {
    drawPortrait(ctx, theme, f, header, headerBottom, opts, texts, {
      showStars,
      showSerial,
      payload,
    });
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
}

// pvc-h: dua kolom, CTA di dalam box QR, footer garis + serial.
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

  const footerH = Math.round(u * 7);
  const footerY = ty + th - pad - footerH;
  ctx.strokeStyle = theme.hairline;
  ctx.lineWidth = Math.max(1, Math.round(u * 0.2));
  ctx.beginPath();
  ctx.moveTo(left, footerY);
  ctx.lineTo(right, footerY);
  ctx.stroke();

  if (flags.showSerial && opts.cardId) {
    ctx.fillStyle = theme.muted;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    setFont(ctx, 500, Math.round(u * 2));
    ctx.fillText(opts.cardId.trim(), right, footerY + footerH / 2);
  }

  const midTop = header.headerCy + header.badgeD / 2 + Math.round(u * 3);
  const midBottom = footerY - Math.round(u * 2);
  const qr = buildQr(flags.payload);

  const qrTarget = f.tw * 0.3;
  const minPad = Math.round(u * 1.5);
  const m = measureQrBox(qr, qrTarget, minPad);
  const ctaSize = ctaFontSize(m, u);
  const boxH = qrBoxHeight(m, ctaSize);
  const boxX = Math.round(right - m.boxW);
  const boxY = Math.round(midTop + (midBottom - midTop - boxH) / 2);
  drawQrBox(ctx, theme, qr, boxX, boxY, m, texts.cta, ctaSize);

  // Kolom teks kiri.
  const textX = left;
  const textW = Math.max(10, boxX - Math.round(u * 3) - textX);
  const name = opts.businessName.trim();
  let cursorY = midTop + Math.round(u * 2);
  ctx.textAlign = "left";

  if (name) {
    ctx.fillStyle = theme.muted;
    setFont(ctx, 600, Math.round(u * 2));
    ctx.fillText(texts.title, textX, cursorY);
    cursorY += Math.round(u * 5.4);
    ctx.fillStyle = theme.heading;
    setFont(ctx, 700, Math.round(u * 4.2));
    ctx.fillText(truncateSingle(ctx, name, textW), textX, cursorY);
    cursorY += Math.round(u * 4.6);
  } else {
    ctx.fillStyle = theme.heading;
    setFont(ctx, 700, Math.round(u * 4.2));
    ctx.fillText(truncateSingle(ctx, texts.title, textW), textX, cursorY);
    cursorY += Math.round(u * 5);
  }

  if (flags.showStars) {
    const starR = Math.round(u * 1.5);
    const starGap = Math.round(u * 0.9);
    ctx.fillStyle = theme.star;
    const starsY = cursorY - Math.round(u * 1.2);
    for (let i = 0; i < 5; i += 1) {
      drawStar(ctx, textX + starR + i * (starR * 2 + starGap), starsY, starR);
    }
    const ratingX = textX + 5 * (starR * 2 + starGap) + Math.round(u * 1.4);
    ctx.fillStyle = theme.heading;
    setFont(ctx, 700, Math.round(u * 2.4));
    ctx.textBaseline = "middle";
    ctx.fillText("5.0", ratingX, starsY);
    ctx.textBaseline = "alphabetic";
    cursorY += Math.round(u * 4.2);
  }

  ctx.fillStyle = theme.body;
  setFont(ctx, 400, Math.round(u * 2.2));
  const descLines = wrapLines(ctx, texts.subCta, textW, 3);
  for (const ln of descLines) {
    if (cursorY > midBottom) break;
    ctx.fillText(ln, textX, cursorY);
    cursorY += Math.round(u * 3.2);
  }
}

// Portrait + persegi: kolom tengah sesuai reference per ukuran.
function drawPortrait(
  ctx: CanvasRenderingContext2D,
  theme: CardTheme,
  f: CardFrame,
  header: HeaderGeom,
  headerBottom: number,
  opts: DrawCardOpts,
  texts: Required<CardTexts>,
  flags: BranchFlags,
): void {
  const { u, pad, ty, th, left, right } = f;
  const cx = (left + right) / 2;
  const name = opts.businessName.trim();
  const bottomPad = Math.round(u * 4);

  const serialH = flags.showSerial && opts.cardId ? Math.round(u * 3.4) : 0;
  const subH = Math.round(u * 3);
  const gapBoxSub = Math.round(u * 4);
  const gapSubSerial = Math.round(u * 2.4);

  let cursorY = headerBottom + Math.round(u * 5);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  if (name) {
    ctx.fillStyle = theme.heading;
    setFont(ctx, 700, Math.round(u * 4.6));
    ctx.fillText(truncateSingle(ctx, name, f.tw - pad * 2), cx, cursorY);
    cursorY += Math.round(u * 4.4);
    ctx.fillStyle = theme.muted;
    setFont(ctx, 400, Math.round(u * 2.2));
    ctx.fillText(truncateSingle(ctx, texts.title, f.tw - pad * 2), cx, cursorY);
    cursorY += Math.round(u * 4.6);
  } else {
    ctx.fillStyle = theme.heading;
    setFont(ctx, 700, Math.round(u * 4.2));
    ctx.fillText(truncateSingle(ctx, texts.title, f.tw - pad * 2), cx, cursorY);
    cursorY += Math.round(u * 5);
  }

  const starsTop = cursorY;
  if (flags.showStars) {
    const starR = Math.round(u * 1.6);
    drawStarsRow(ctx, theme, cx, cursorY, starR, Math.round(u * 2.4), true);
    cursorY += Math.round(u * 4);
  }

  const bottomEdge = ty + th - pad - bottomPad;
  const subBottom = bottomEdge - serialH - (serialH > 0 ? gapSubSerial : 0);
  const subCy = subBottom - subH / 2;
  const zoneTop = Math.max(cursorY, starsTop + Math.round(u * 2));
  const zoneBottom = subBottom - subH - gapBoxSub;
  const qrTarget = Math.min(
    f.tw * PORTRAIT_QR_WIDTH_FACTOR,
    Math.max(10, zoneBottom - zoneTop),
  );
  const qr = buildQr(flags.payload);
  const minPad = Math.round(u * 1.5);
  const m = measureQrBox(qr, qrTarget, minPad);
  const ctaSize = ctaFontSize(m, u);
  const boxH = qrBoxHeight(m, ctaSize);
  const boxX = Math.round(cx - m.boxW / 2);
  const boxY = Math.round(zoneTop + (zoneBottom - zoneTop - boxH) / 2);
  drawQrBox(ctx, theme, qr, boxX, boxY, m, texts.cta, ctaSize);

  ctx.fillStyle = theme.muted;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  setFont(ctx, 400, Math.round(u * 2));
  const subLines = wrapLines(ctx, texts.subCta, f.tw - pad * 3, 1);
  if (subLines.length > 0) {
    ctx.fillText(subLines[0], cx, Math.round(subCy));
  }

  if (flags.showSerial && opts.cardId) {
    ctx.fillStyle = theme.muted;
    setFont(ctx, 500, Math.round(u * 1.9));
    ctx.fillText(
      opts.cardId.trim(),
      cx,
      Math.round(bottomEdge - serialH / 2),
    );
  }
}
