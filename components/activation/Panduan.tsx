"use client";

import type { ReactNode } from "react";

const STEPS: ReactNode[] = [
  <>
    Tempel link Google Maps toko Anda apa adanya: buka toko, tekan Bagikan lalu
    Salin link. Sistem otomatis mengarahkan pengunjung ke form tulis ulasan
    Google.
  </>,
  <>
    Atau cari nama toko di Google Search, klik kanan tombol Tulis ulasan, lalu
    pilih Salin tautan.
  </>,
  <>
    Atau manual: buka{" "}
    <a
      href="https://developers.google.com/maps/documentation/places/find-place-id"
      target="_blank"
      rel="noreferrer"
      className="text-ink underline underline-offset-2 hover:text-deep-gray focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
    >
      Place ID Finder resmi Google
    </a>
    , cari nama toko, lalu susun link seperti ini:
    <code className="mt-1.5 block break-words rounded-lg border border-hairline bg-surface-alt px-2.5 py-1.5 font-mono text-xs text-ink">
      https://search.google.com/local/writereview?placeid=PLACE_ID
    </code>
  </>,
  <>
    Bila place ID tidak terdeteksi, link tetap dibuka apa adanya dan aktivasi
    tetap berhasil.
  </>,
];

const BUTTON_CLASS =
  "inline-flex min-h-9 items-center rounded-full border border-hairline px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-alt focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none";

export function PanduanToggle({
  id,
  open,
  onToggle,
}: {
  id: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={id}
      onClick={onToggle}
      className={BUTTON_CLASS}
    >
      Panduan
    </button>
  );
}

export function PanduanPanel({ id, open }: { id: string; open: boolean }) {
  if (!open) return null;
  return (
    <div
      id={id}
      className="mt-3 max-w-full rounded-2xl border border-hairline bg-canvas p-4 sm:p-5"
    >
      <p className="text-sm font-semibold text-ink">
        Cara ambil link ulasan Google
      </p>
      <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-6 text-deep-gray marker:font-semibold marker:text-ink [&_a]:break-words">
        {STEPS.map((step, i) => (
          <li key={i} className="pl-1 break-words">
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
