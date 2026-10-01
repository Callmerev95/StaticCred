"use client";

const STEPS = [
  "Tempel link Google Maps toko Anda apa adanya (Bagikan lalu Salin link). Sistem otomatis mengarahkan pengunjung ke form tulis ulasan Google.",
  "Atau cari nama toko di Google Search, klik kanan tombol Tulis ulasan, lalu pilih Salin tautan.",
  "Atau manual: buka Place ID Finder resmi Google (developers.google.com/maps/documentation/places/find-place-id), cari nama toko, lalu susun link https://search.google.com/local/writereview?placeid=PLACE_ID.",
  "Bila place ID tidak terdeteksi, link tetap dibuka apa adanya dan aktivasi tetap berhasil.",
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
      className="mt-3 rounded-2xl border border-hairline bg-canvas p-4"
    >
      <p className="text-sm font-semibold">Cara ambil link ulasan Google:</p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-deep-gray">
        {STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
