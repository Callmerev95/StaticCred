// Satu sumber render kartu review untuk preview dan export.
// Semua koordinat dalam piksel export. Lihat ADR-0002, CONTEXT.md,
// reference/stitch-reference.png.
import qrcode from "qrcode-generator";
import { BLEED_MM, mmToPx } from "./sizes";
import { getCardTheme, type CardThemeId } from "./card-themes";

export const QR_ECC = "H" as const;
export const QR_QUIET_MODULES = 4;
export const QR_VERSION_WARN = 10;

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

// Ikon gelombang tap: tiga busur + titik, digambar vector.
function drawTapGlyph(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  for (let k = 1; k <= 2; k += 1) {
    ctx.arc(cx, cy, r * (0.35 + k * 0.3), -Math.PI / 3, Math.PI / 3);
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
  x: number;
  y: number;
  w: number;
  h: number;
  cell: number;
  originX: number;
  originY: number;
  drawn: number;
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
  traceRoundRect(ctx, tx, ty, tw, th, Math.round(Math.min(tw, th) * 0.055));
  ctx.clip();

  const u = tw / 100;
  const pad = Math.round(tw * 0.055);
  const left = tx + pad;
  const right = tx + tw - pad;

  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
      "0.04em";
  } catch {
    // letterSpacing opsional, abaikan bila canvas tidak mendukung.
  }

  // Header: badge G + label kiri, pill TAP NFC kanan.
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
    ctx.fillText("G", left + badgeD / 2, headerCy + badgeD * 0.04);
  }

  ctx.fillStyle = theme.heading;
  ctx.textAlign = "left";
  setFont(ctx, 600, Math.round(u * 2.1));
  const badgeX = left + badgeD + Math.round(u * 1.6);
  // contentRight dihitung dari pill NFC agar badge tidak tertimpa di kartu sempit.
  const nfcLabelW = showNfc
    ? ctx.measureText("TAP NFC").width + Math.round(u * 4.4)
    : 0;
  const contentRight = showNfc ? right - nfcLabelW - Math.round(u * 2) : right;
  ctx.fillText(
    truncateSingle(ctx, texts.badge, Math.max(10, contentRight - badgeX)),
    badgeX,
    headerCy,
  );

  if (showNfc) {
    const pillH = Math.round(u * 4.4);
    const pillPadX = Math.round(u * 2.2);
    setFont(ctx, 600, Math.round(u * 1.9));
    const label = "TAP NFC";
    const labelW = ctx.measureText(label).width;
    const pillW = Math.round(labelW + pillPadX * 2);
    const pillX = right - pillW;
    const pillY = headerCy - pillH / 2;
    ctx.fillStyle = theme.pillBg;
    fillRoundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fillStyle = theme.pillFg;
    ctx.textAlign = "center";
    ctx.fillText(label, pillX + pillW / 2, headerCy + pillH * 0.04);
  }

  // Footer: garis hairline + CTA kiri + serial kanan.
  const footerH = Math.round(u * 9);
  const footerY = ty + th - pad - footerH;
  ctx.strokeStyle = theme.hairline;
  ctx.lineWidth = Math.max(1, Math.round(u * 0.2));
  ctx.beginPath();
  ctx.moveTo(left, footerY);
  ctx.lineTo(right, footerY);
  ctx.stroke();

  const footerCy = footerY + footerH / 2 + Math.round(u * 1.2);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  setFont(ctx, 700, Math.round(u * 2.4));
  const ctaW = ctx.measureText(texts.cta).width;
  const glyphR = Math.round(u * 2.2);
  let ctaX = left;
  if (theme.ctaBg) {
    const pillH = Math.round(u * 5.2);
    const pillPadX = Math.round(u * 3);
    const pillW = Math.round(ctaW + pillPadX * 2);
    ctx.fillStyle = theme.ctaBg;
    fillRoundRect(ctx, left, footerCy - pillH / 2, pillW, pillH, pillH / 2);
    ctx.fillStyle = theme.ctaFg;
    ctx.textAlign = "center";
    ctx.fillText(texts.cta, left + pillW / 2, footerCy + pillH * 0.04);
    ctaX = left + pillW + glyphR * 2;
  } else {
    ctx.fillStyle = theme.ctaFg;
    ctx.strokeStyle = theme.ctaFg;
    ctx.lineWidth = Math.max(1, Math.round(u * 0.25));
    drawTapGlyph(ctx, left + glyphR, footerCy, glyphR);
    ctaX = left + glyphR * 2 + Math.round(u);
    ctx.fillText(texts.cta, ctaX, footerCy);
  }

  if (showSerial && opts.cardId) {
    ctx.fillStyle = theme.muted;
    ctx.textAlign = "right";
    setFont(ctx, 500, Math.round(u * 2));
    ctx.fillText(opts.cardId.trim(), right, footerCy);
  }

  // Zona tengah: teks kiri, QR kanan.
  const midTop = headerCy + badgeD / 2 + Math.round(u * 3);
  const midBottom = footerY - Math.round(u * 3);
  const qr = buildQr(payload);
  const n = qr.getModuleCount();
  const totalUnits = n + QR_QUIET_MODULES * 2;

  const qrSide = Math.round(Math.min(tw * 0.27, (midBottom - midTop) * 0.72));
  const cell = Math.max(1, Math.floor(qrSide / totalUnits));
  const drawn = cell * totalUnits;
  const innerPad = cell * 2;
  const captionH = Math.round(u * 3.4);
  const boxW = drawn + innerPad * 2;
  const boxH = drawn + innerPad * 2 + captionH;
  const boxX = Math.round(right - boxW);
  const boxY = Math.round(midTop + (midBottom - midTop - boxH) / 2);

  if (theme.qrBoxed) {
    ctx.fillStyle = theme.qrBg;
    fillRoundRect(ctx, boxX, boxY, boxW, boxH, Math.round(u * 1.6));
  }
  drawQrModules(
    ctx,
    qr,
    {
      x: boxX,
      y: boxY,
      w: boxW,
      h: boxH,
      cell,
      originX: boxX + innerPad,
      originY: boxY + innerPad,
      drawn,
    },
    theme.qrFg,
  );
  ctx.fillStyle = theme.qrBoxed ? "#5f6368" : theme.muted;
  ctx.textAlign = "center";
  setFont(ctx, 500, Math.round(u * 1.7));
  ctx.fillText(
    `ECC-H • ${QR_QUIET_MODULES} MOD`,
    boxX + boxW / 2,
    boxY + innerPad + drawn + captionH / 2,
  );

  // Kolom teks.
  const textX = left;
  const textW = Math.max(10, boxX - Math.round(u * 3) - textX);
  const name = opts.businessName.trim();
  let cursorY = midTop + Math.round(u * 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

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

  if (showStars) {
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

  ctx.restore();

  if (opts.bleed && bleedPx > 0) {
    drawCropMarks(ctx, W, H, bleedPx, theme.muted);
  }
}
