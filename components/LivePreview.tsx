"use client";

import { useEffect, useId, useRef, useState } from "react";
import { drawCard, getQrInfo, type DrawCardOpts } from "@/lib/render-card";
import {
  BLEED_MM,
  CARD_SIZES,
  dimensionBadge,
  exportDims,
  getSize,
  mmToPx,
  outputSummary,
  type SizeId,
} from "@/lib/sizes";
import type { CardFormState } from "@/lib/form-state";

export type ZoomLevel = "75" | "100" | "fit";

interface LivePreviewProps {
  form: CardFormState;
  qrPayload: string;
  sizeId: SizeId;
  onSizeChange: (size: SizeId) => void;
  onReset: () => void;
}

function buildDrawOpts(
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

export default function LivePreview({
  form,
  qrPayload,
  sizeId,
  onSizeChange,
  onReset,
}: LivePreviewProps) {
  const uid = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState<ZoomLevel>("fit");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const size = getSize(sizeId);
  const dims = exportDims(size, form.bleed);
  const bleedPx = form.bleed ? mmToPx(BLEED_MM) : 0;
  const hasPayload = qrPayload.trim().length > 0;
  const qrInfo = hasPayload ? getQrInfo(qrPayload) : null;

  useEffect(() => {
    if (!hasPayload) return;
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 2D tidak tersedia di browser ini.");
        ctx.imageSmoothingQuality = "high";
        drawCard(ctx, buildDrawOpts(form, qrPayload, dims));
        setRenderError(null);
      } catch (e) {
        setRenderError(
          e instanceof Error ? e.message : "Gagal merender kartu.",
        );
      }
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [form, qrPayload, dims, hasPayload]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const summary = [
    form.businessName || form.cardId,
    size.label,
    outputSummary(size, form.bleed),
    qrPayload,
  ]
    .filter(Boolean)
    .join(" | ");

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = summary;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
  };

  const downloadPng = () => {
    const canvas = document.createElement("canvas");
    canvas.width = dims.widthPx;
    canvas.height = dims.heightPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // TODO(#7): verifikasi dimensi byte + PDF presisi mm.
    drawCard(ctx, buildDrawOpts(form, qrPayload, dims));
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `staticcred-${sizeId}${form.bleed ? "-bleed" : ""}.png`;
    a.click();
  };

  const canvasStyle =
    zoom === "fit"
      ? { width: "100%", height: "auto" as const }
      : { width: Math.round(dims.widthPx * (zoom === "75" ? 0.75 : 1)), height: "auto" as const };

  return (
    <section
      aria-labelledby={`${uid}-heading`}
      className="flex flex-col gap-4 rounded-3xl border border-hairline bg-paper p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${uid}-heading`} className="text-lg font-semibold">
          Live Canvas Preview
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-hairline bg-canvas px-3 py-1 font-mono text-xs text-mid-gray">
            {dimensionBadge(size)}
          </span>
          <span
            aria-hidden="true"
            className="rounded-full border border-hairline bg-canvas px-3 py-1 font-mono text-xs text-mid-gray"
          >
            300 DPI
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <label
            htmlFor={`${uid}-size`}
            className="mb-1 block font-mono text-xs text-mid-gray"
          >
            Ukuran kartu
          </label>
          <select
            id={`${uid}-size`}
            value={sizeId}
            onChange={(e) => onSizeChange(e.target.value as SizeId)}
            className="min-h-11 rounded-2xl border border-hairline bg-surface-alt px-3 text-sm font-medium text-ink focus:border-ink focus:outline-none"
          >
            {CARD_SIZES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({s.widthMm}×{s.heightMm} mm)
              </option>
            ))}
          </select>
        </div>
        <div
          role="group"
          aria-label="Zoom preview"
          className="flex gap-1 self-end rounded-full border border-hairline bg-canvas p-1"
        >
          {(["75", "100", "fit"] as const).map((z) => (
            <button
              key={z}
              type="button"
              aria-pressed={zoom === z}
              onClick={() => setZoom(z)}
              className={`min-h-9 rounded-full px-3 font-mono text-xs font-semibold focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none ${
                zoom === z ? "bg-ink text-paper" : "text-mid-gray"
              }`}
            >
              {z === "fit" ? "Fit" : `${z}%`}
            </button>
          ))}
        </div>
      </div>

      {qrInfo?.tooDense && (
        <p
          role="alert"
          className="rounded-2xl border border-hairline bg-canvas px-4 py-3 text-sm text-ink"
        >
          QR versi {qrInfo.version}, payload padat. Hasil cetak mungkin sulit
          dipindai, pendekkan link bila bisa.
        </p>
      )}

      <div
        className="overflow-x-auto rounded-2xl border border-hairline p-4 sm:p-8"
        style={{
          backgroundImage: "radial-gradient(var(--color-hairline) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      >
        {!hasPayload ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-hairline bg-paper/80 px-6 py-16 text-center">
            <p className="font-semibold text-ink">Belum ada QR</p>
            <p className="max-w-xs text-sm text-mid-gray">
              Tempel link review di tab Link Langsung untuk melihat kartu di
              sini.
            </p>
          </div>
        ) : renderError ? (
          <div
            role="alert"
            className="rounded-2xl border border-ember/30 bg-paper px-6 py-10 text-center text-sm text-ember"
          >
            {renderError}
          </div>
        ) : (
          <div className="relative mx-auto w-fit max-w-full">
            <canvas
              ref={canvasRef}
              width={dims.widthPx}
              height={dims.heightPx}
              style={canvasStyle}
              role="img"
              aria-label={`Preview kartu ${size.label}`}
              className="block h-auto max-w-none rounded-lg shadow-sm"
            />
            {form.bleed && zoom === "fit" && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute rounded-sm border border-dashed border-mid-gray"
                style={{
                  inset: `${(bleedPx / dims.heightPx) * 100}% ${
                    (bleedPx / dims.widthPx) * 100
                  }%`,
                }}
              />
            )}
          </div>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={!hasPayload}
          onClick={downloadPng}
          className="min-h-12 rounded-full bg-ink px-5 text-sm font-semibold text-paper transition-opacity focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          Download PNG Siap Cetak (300 DPI)
        </button>
        <button
          type="button"
          disabled
          title="PDF presisi mm menyusul di tiket #7"
          className="min-h-12 cursor-not-allowed rounded-full border border-hairline px-5 text-sm font-semibold text-mid-gray"
        >
          Download PDF (segera)
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
        <p className="font-mono text-xs text-mid-gray" aria-live="polite">
          {outputSummary(size, form.bleed)}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copySummary}
            className="min-h-9 rounded-full px-3 text-xs font-semibold text-ink hover:bg-surface-alt focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            {copied ? "Tersalin ✓" : "Salin Ringkasan"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="min-h-9 rounded-full px-3 text-xs font-semibold text-ember hover:bg-surface-alt focus-visible:ring-2 focus-visible:ring-ember focus-visible:outline-none"
          >
            Reset Form
          </button>
        </div>
      </div>
    </section>
  );
}
