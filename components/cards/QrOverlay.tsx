// Overlay QR per kartu di /cards: backdrop blur, dialog terpusat berisi
// QR + tombol Unduh QR. QR digambar client-side via qrcode-generator
// (dep yang sama dengan render kartu cetak). Tutup via tombol,
// klik backdrop, atau Escape.
"use client";

import { useEffect, useRef } from "react";
import qrcode from "qrcode-generator";
import type { ListedCard } from "@/lib/store";

const QUIET_MODULES = 4;
const QR_PX = 480;

function drawQr(canvas: HTMLCanvasElement, payload: string) {
  const qr = qrcode(0, "H");
  qr.addData(payload);
  qr.make();
  const count = qr.getModuleCount();
  const total = count + QUIET_MODULES * 2;
  const cell = Math.max(1, Math.floor(QR_PX / total));
  const dim = cell * total;
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, dim, dim);
  ctx.fillStyle = "#111729";
  for (let r = 0; r < count; r += 1) {
    for (let c = 0; c < count; c += 1) {
      if (qr.isDark(r, c)) {
        ctx.fillRect(
          (c + QUIET_MODULES) * cell,
          (r + QUIET_MODULES) * cell,
          cell,
          cell,
        );
      }
    }
  }
}

export default function QrOverlay({
  card,
  payload,
  onClose,
}: {
  card: ListedCard;
  payload: string;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (canvasRef.current) drawQr(canvasRef.current, payload);
  }, [payload]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function download() {
    const url = canvasRef.current?.toDataURL("image/png");
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `QR-${card.id}.png`;
    a.click();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-5 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`qr-title-${card.id}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-hairline bg-paper p-6 text-center shadow-sm"
      >
        <h2
          id={`qr-title-${card.id}`}
          className="text-xl font-semibold tracking-tight"
        >
          QR Code - {card.id}
        </h2>
        <p className="mt-1 text-sm text-deep-gray">Scan Untuk Test</p>
        <div className="mx-auto mt-4 w-fit rounded-2xl border border-hairline bg-white p-3">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`QR menuju kartu ${card.id}`}
            className="block h-56 w-56"
          />
        </div>
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={download}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-paper focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Unduh QR
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-hairline px-5 text-sm font-semibold text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
