"use client";

import { useState } from "react";
import { activateCardAction } from "@/lib/actions";
import { BUSINESS_NAME_MAX } from "@/lib/form-state";
import { extractPlaceId } from "@/lib/review-url";
import { BTN_PRIMARY, ERROR_BOX, LABEL_FIELD } from "@/lib/ui-classes";
import { ActivationSuccess } from "./views";
import { useResolvedStatus } from "./useResolvedStatus";
import { PanduanPanel, PanduanToggle } from "./Panduan";

export default function ActivationForm({ serial }: { serial: string }) {
  const [nama, setNama] = useState("");
  const [url, setUrl] = useState("");
  const [pin, setPin] = useState("");
  const [pinUlang, setPinUlang] = useState("");
  const [panduanOpen, setPanduanOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const remote = useResolvedStatus(url);

  const urlHint = extractPlaceId(url)
    ? "Place ID terdeteksi. Pengunjung diarahkan ke form tulis ulasan di Google Search."
    : remote === "checking"
      ? "Mengecek link..."
      : remote === "ok"
        ? "Place ID ditemukan. Pengunjung diarahkan ke form tulis ulasan di Google Search."
        : "Belum terdeteksi place ID, link dibuka apa adanya. Buka Panduan untuk cara ambil link tulis ulasan.";

  if (done) {
    return <ActivationSuccess serial={serial} nama={nama.trim()} url={url.trim()} />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setError(null);

    if (!nama.trim() || nama.trim().length > BUSINESS_NAME_MAX) {
      setError("Nama tempat usaha wajib diisi, maksimal 60 karakter.");
      return;
    }
    if (!/^https:\/\/\S+$/.test(url.trim())) {
      setError("Link harus diawali https:// dan berupa URL Google Maps atau Google Review.");
      return;
    }
    if (!/^\d{4,8}$/.test(pin)) {
      setError("PIN harus 4 sampai 8 angka.");
      return;
    }
    if (pin !== pinUlang) {
      setError("Ulangi PIN harus sama dengan PIN baru.");
      return;
    }

    setPending(true);
    try {
      const result = await activateCardAction(serial, { nama, url, pin });
      if (result.ok) {
        setDone(true);
      } else {
        setError(result.error ?? "Aktivasi gagal. Coba lagi.");
      }
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 px-5 py-10">
      <header className="text-center">
        <p className="mx-auto w-fit rounded-full border border-hairline bg-paper px-3 py-1 font-mono text-xs text-mid-gray">
          Setup Kartu Review
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Aktivasi Kartu Review
        </h1>
        <p className="mt-2 text-sm text-deep-gray">
          Tempel link ulasan toko untuk mengaktifkan kartu ini.
        </p>
      </header>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-paper px-4 py-3">
        <span className="font-mono text-sm text-deep-gray">ID Kartu:</span>
        <span className="rounded-lg border border-hairline bg-surface-alt px-3 py-1.5 font-mono text-base font-semibold text-ink">
          {serial}
        </span>
      </div>

      <form
        onSubmit={onSubmit}
        noValidate
        className="rounded-3xl border border-hairline bg-paper p-5 shadow-sm sm:p-6"
      >
        <div>
          <label
            htmlFor="akt-nama"
            className={LABEL_FIELD}
          >
            1. Nama tempat usaha / toko
          </label>
          <input
            id="akt-nama"
            type="text"
            autoComplete="organization"
            maxLength={BUSINESS_NAME_MAX}
            placeholder="Contoh: Kopi Sangkara / Bistro Kita"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            aria-describedby="akt-nama-hint"
            className="mt-2 w-full rounded-2xl border border-hairline bg-surface-alt px-4 py-3 text-sm text-ink placeholder:text-mid-gray focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none"
          />
          <p id="akt-nama-hint" className="mt-2 text-xs text-mid-gray">
            Nama ini akan tampil sebagai konfirmasi saat kartu diakses.
          </p>
        </div>

        <hr className="my-6 border-hairline" />

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="akt-url"
              className={LABEL_FIELD}
            >
              2. Link Google Review / Maps
            </label>
            <div className="flex items-center gap-2">
              <a
                href="https://www.google.com/maps"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 items-center rounded-full border border-hairline px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-ink transition-colors hover:bg-surface-alt focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
              >
                Cari di Google Maps
              </a>
              <PanduanToggle
                id="akt-panduan"
                open={panduanOpen}
                onToggle={() => setPanduanOpen((v) => !v)}
              />
            </div>
          </div>
          <input
            id="akt-url"
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="https://www.google.com/maps/place/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-describedby="akt-url-hint"
            className="mt-2 w-full rounded-2xl border border-hairline bg-surface-alt px-4 py-3 font-mono text-sm text-ink placeholder:text-mid-gray focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none"
          />
          <p id="akt-url-hint" className="mt-2 text-xs text-mid-gray">
            {urlHint}
          </p>

          <PanduanPanel id="akt-panduan" open={panduanOpen} />
        </div>

        <hr className="my-6 border-hairline" />

        <div>
          <label
            htmlFor="akt-pin"
            className={LABEL_FIELD}
          >
            3. PIN keamanan (4-8 angka)
          </label>
          <p className="mt-1.5 text-xs text-mid-gray">
            Dipakai jika nanti Anda ingin mengganti link ulasan toko. Tidak ada
            pemulihan PIN, simpan di tempat aman.
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <input
              id="akt-pin"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={8}
              placeholder="PIN Baru (4-8 angka)"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-2xl border border-hairline bg-surface-alt px-4 py-3 font-mono text-sm text-ink placeholder:text-mid-gray focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none"
            />
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={8}
              placeholder="Ulangi PIN"
              aria-label="Ulangi PIN"
              value={pinUlang}
              onChange={(e) => setPinUlang(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-2xl border border-hairline bg-surface-alt px-4 py-3 font-mono text-sm text-ink placeholder:text-mid-gray focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none"
            />
          </div>
        </div>

        <div role="alert" aria-live="assertive" className="min-h-0">
          {error && <p className={ERROR_BOX}>{error}</p>}
        </div>

        <button
          type="submit"
          disabled={pending}
          className={`mt-5 ${BTN_PRIMARY}`}
        >
          {pending ? "Mengaktifkan..." : "Aktifkan Kartu"}
        </button>
      </form>

      <p className="text-center font-mono text-xs text-mid-gray">
        Tujuan akhir: form tulis ulasan Google Search
      </p>
    </main>
  );
}
