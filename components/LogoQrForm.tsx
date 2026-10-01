"use client";

import { useId, useRef, useState } from "react";
import type { CardFormState } from "@/lib/form-state";
import { loadCardLogo, logoFileError, LOGO_ACCEPT } from "@/lib/logo";
import { ERROR_BOX, H2_PANEL, LABEL_CAPTION } from "@/lib/ui-classes";

interface LogoQrFormProps {
  state: CardFormState;
  onChange: (patch: Partial<CardFormState>) => void;
}

// Section "2. Logo QR (Opsional)": logo user menggantikan logo G di
// tengah panel QR. Data URL hanya di state lokal, tidak dikirim ke server.
export default function LogoQrForm({ state, onChange }: LogoQrFormProps) {
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const hasLogo = state.logoDataUrl.length > 0;

  const onPick = (file: File | undefined) => {
    if (!file) return;
    const invalid = logoFileError(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) {
        setError("File gagal dibaca. Coba file lain.");
        return;
      }
      // Pastikan gambar valid sebelum masuk preview.
      loadCardLogo(dataUrl).then((img) => {
        if (!img) {
          setError("File bukan gambar yang valid. Coba file lain.");
          return;
        }
        setError(null);
        onChange({ logoDataUrl: dataUrl });
      });
    };
    reader.onerror = () => setError("File gagal dibaca. Coba file lain.");
    reader.readAsDataURL(file);
  };

  return (
    <section
      aria-labelledby={`${uid}-heading`}
      className="rounded-3xl border border-hairline bg-paper p-5 shadow-sm sm:p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink font-mono text-sm font-semibold text-paper"
        >
          2
        </span>
        <h2 id={`${uid}-heading`} className={H2_PANEL}>
          Logo QR (Opsional)
        </h2>
      </div>

      {hasLogo ? (
        <div className="flex items-center gap-4 rounded-2xl border border-hairline bg-canvas p-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau data URL, bukan aset publik */}
          <img
            src={state.logoDataUrl}
            alt="Pratinjau logo yang terpasang di tengah QR"
            className="h-14 w-14 rounded-xl border border-hairline bg-paper object-contain p-1"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Logo terpasang</p>
            <p className="mt-0.5 text-xs text-mid-gray">
              Tampil di tengah panel QR pada semua ukuran kartu.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setError(null);
              onChange({ logoDataUrl: "" });
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="min-h-11 shrink-0 rounded-full border border-hairline px-4 text-sm font-semibold text-ember hover:bg-surface-alt focus-visible:ring-2 focus-visible:ring-ember focus-visible:outline-none"
          >
            Hapus logo
          </button>
        </div>
      ) : (
        <label
          htmlFor={`${uid}-file`}
          className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-hairline bg-surface-alt px-4 py-4 text-sm font-semibold text-ink transition-colors hover:border-ink focus-within:ring-2 focus-within:ring-ink focus-within:outline-none"
        >
          Pilih File Logo
          <input
            ref={inputRef}
            id={`${uid}-file`}
            type="file"
            accept={LOGO_ACCEPT}
            className="sr-only"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
        </label>
      )}

      <p
        id={`${uid}-hint`}
        aria-live="polite"
        className={
          error ? ERROR_BOX : `mt-2 ${LABEL_CAPTION}`
        }
      >
        {error ??
          "Kosongkan atau hapus untuk memakai logo Google. PNG, JPG, atau WebP, maksimal 1 MB."}
      </p>
    </section>
  );
}
