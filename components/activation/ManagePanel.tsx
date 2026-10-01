"use client";

import Link from "next/link";
import { useState } from "react";
import { updateCardAction, verifyPinAction } from "@/lib/actions";
import { BUSINESS_NAME_MAX } from "@/lib/form-state";

export default function ManagePanel({
  serial,
  initialScan,
}: {
  serial: string;
  initialScan: number;
}) {
  const [stage, setStage] = useState<"gate" | "edit">("gate");
  const [pin, setPin] = useState("");
  const [card, setCard] = useState<{ nama: string; url: string } | null>(null);
  const [nama, setNama] = useState("");
  const [url, setUrl] = useState("");
  const [pinBaru, setPinBaru] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setError(null);
    if (!/^\d{4,8}$/.test(pin)) {
      setError("PIN harus 4 sampai 8 angka.");
      return;
    }
    setPending(true);
    try {
      const result = await verifyPinAction(serial, pin);
      if (result.ok && result.card) {
        setCard(result.card);
        setNama(result.card.nama);
        setUrl(result.card.url);
        setStage("edit");
      } else {
        setError(result.error ?? "PIN salah.");
      }
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setPending(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending || !card) return;
    setError(null);
    setNotice(null);
    setPending(true);
    try {
      const result = await updateCardAction(serial, pin, { nama, url, pinBaru });
      if (result.ok) {
        setPinBaru("");
        setNotice("Perubahan tersimpan.");
      } else {
        setError(result.error ?? "Gagal menyimpan.");
      }
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setPending(false);
    }
  };

  if (stage === "gate") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 px-5 py-10">
        <header className="text-center">
          <p className="mx-auto w-fit rounded-full border border-hairline bg-paper px-3 py-1 font-mono text-xs text-mid-gray">
            Pengaturan Kartu
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Kelola Kartu #{serial}
          </h1>
          <p className="mt-2 text-sm text-deep-gray">
            Masukkan PIN yang Anda pasang saat aktivasi untuk mengganti nama toko
            atau link ulasan.
          </p>
        </header>
        <form
          onSubmit={unlock}
          noValidate
          className="rounded-3xl border border-hairline bg-paper p-6 shadow-sm"
        >
          <label
            htmlFor="kelola-pin"
            className="font-mono text-xs font-semibold tracking-widest text-ink uppercase"
          >
            PIN kartu
          </label>
          <input
            id="kelola-pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            maxLength={8}
            placeholder="4-8 angka"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="mt-2 w-full rounded-2xl border border-hairline bg-surface-alt px-4 py-3 font-mono text-sm text-ink placeholder:text-mid-gray focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none"
          />
          {error && (
            <p role="alert" className="mt-3 text-sm text-ember">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="mt-5 min-h-12 w-full rounded-full bg-ink px-5 text-sm font-semibold text-paper focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
          >
            {pending ? "Memeriksa..." : "Buka pengaturan"}
          </button>
        </form>
        <Link
          href={`/r/${serial}`}
          className="text-center text-sm text-deep-gray underline decoration-hairline underline-offset-2 hover:text-ink"
        >
          Lihat tampilan kartu
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 px-5 py-10">
      <header className="text-center">
        <p className="mx-auto w-fit rounded-full border border-hairline bg-paper px-3 py-1 font-mono text-xs text-mid-gray">
          Pengaturan Kartu
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Kelola Kartu #{serial}
        </h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-hairline bg-paper p-4">
          <p className="font-mono text-xs text-mid-gray">Total scan</p>
          <p className="mt-1 text-2xl font-semibold">{initialScan}</p>
        </div>
        <div className="rounded-2xl border border-hairline bg-paper p-4">
          <p className="font-mono text-xs text-mid-gray">Status kartu</p>
          <p className="mt-1 text-2xl font-semibold text-green-700">Aktif</p>
        </div>
      </div>

      <form
        onSubmit={save}
        noValidate
        className="rounded-3xl border border-hairline bg-paper p-5 shadow-sm sm:p-6"
      >
        <label
          htmlFor="kelola-nama"
          className="font-mono text-xs font-semibold tracking-widest text-ink uppercase"
        >
          Nama tempat usaha
        </label>
        <input
          id="kelola-nama"
          type="text"
          maxLength={BUSINESS_NAME_MAX}
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-hairline bg-surface-alt px-4 py-3 text-sm text-ink placeholder:text-mid-gray focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none"
        />

        <label
          htmlFor="kelola-url"
          className="mt-5 block font-mono text-xs font-semibold tracking-widest text-ink uppercase"
        >
          Link ulasan Google
        </label>
        <input
          id="kelola-url"
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-hairline bg-surface-alt px-4 py-3 font-mono text-sm text-ink placeholder:text-mid-gray focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none"
        />

        <label
          htmlFor="kelola-pin-baru"
          className="mt-5 block font-mono text-xs font-semibold tracking-widest text-ink uppercase"
        >
          PIN baru (opsional)
        </label>
        <input
          id="kelola-pin-baru"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={8}
          placeholder="Kosongkan jika tidak diganti"
          value={pinBaru}
          onChange={(e) => setPinBaru(e.target.value.replace(/\D/g, ""))}
          className="mt-2 w-full rounded-2xl border border-hairline bg-surface-alt px-4 py-3 font-mono text-sm text-ink placeholder:text-mid-gray focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none"
        />

        <div role="alert" aria-live="polite">
          {error && (
            <p className="mt-4 rounded-2xl border border-ember/40 bg-ember/5 px-4 py-3 text-sm text-ember">
              {error}
            </p>
          )}
          {notice && (
            <p className="mt-4 rounded-2xl border border-hairline bg-canvas px-4 py-3 text-sm text-deep-gray">
              {notice}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-5 min-h-12 w-full rounded-full bg-ink px-5 text-sm font-semibold text-paper focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
        >
          {pending ? "Menyimpan..." : "Simpan perubahan"}
        </button>
        <Link
          href={`/r/${serial}`}
          className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full border border-hairline px-5 text-sm font-semibold text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
        >
          Tes buka review
        </Link>
      </form>
    </main>
  );
}
