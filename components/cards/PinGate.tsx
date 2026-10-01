// Gerbang PIN /cards (client): kirim PIN ke /api/cards/auth, refresh bila lolos.
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BTN_PRIMARY, ERROR_BOX, LABEL_EYEBROW, LABEL_FIELD } from "@/lib/ui-classes";

export default function PinGate({ unconfigured }: { unconfigured: boolean }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/cards/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        setError(
          res.status === 503
            ? "PIN admin belum dipasang di server (env ADMIN_PIN)."
            : "PIN salah. Coba lagi.",
        );
        return;
      }
      router.refresh();
    } catch {
      setError("Jaringan gagal. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <section className="rounded-3xl border border-hairline bg-paper p-6 shadow-sm">
        <p className={LABEL_EYEBROW}>
          Area pemilik
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Daftar Kartu QR</h1>
        <p className="mt-3 text-sm leading-relaxed text-deep-gray">
          Halaman ini memuat semua serial dan link tujuan toko, jadi hanya
          pemilik yang memegang PIN admin yang boleh masuk.
        </p>
        {unconfigured ? (
          <p className="mt-4 rounded-2xl border border-hairline bg-surface-alt px-4 py-3 text-sm text-deep-gray">
            PIN admin belum dipasang di server (env ADMIN_PIN), halaman daftar
            kartu belum bisa dibuka.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-5">
            <label htmlFor="cards-pin" className={LABEL_FIELD}>
              PIN admin
            </label>
            <input
              id="cards-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Masukkan PIN admin"
              className="mt-2 w-full rounded-2xl border border-hairline bg-surface-alt px-4 py-3 text-sm text-ink placeholder:text-mid-gray focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none"
            />
            {error && (
              <p role="alert" className={ERROR_BOX}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy || pin.trim().length === 0}
              className={`mt-4 ${BTN_PRIMARY}`}
            >
              {busy ? "Memeriksa..." : "Buka daftar kartu"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
