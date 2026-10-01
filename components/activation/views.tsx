// Tampilan server-safe jalur aktivasi: belum dikonfigurasi, interstitial, sukses.
// Dipakai app/r/[id]/* dan ActivationForm (client) tanpa duplikasi copy.

import Link from "next/link";

export function UnavailableView({ serial }: { serial?: string }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <section className="rounded-3xl border border-hairline bg-paper p-6 shadow-sm">
        <p className="font-mono text-xs font-semibold tracking-widest text-mid-gray uppercase">
          Aktivasi belum aktif
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Layanan aktivasi belum siap</h1>
        <p className="mt-3 text-sm leading-relaxed text-deep-gray">
          Server ini belum dihubungkan ke penyimpanan kartu, jadi
          {serial ? ` kartu ${serial} ` : "kartu ini "}
          belum bisa diaktifkan. Pengaturan env KV perlu dipasang dulu oleh pemilik
          aplikasi.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-paper focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Buka pembuat kartu
        </Link>
      </section>
    </main>
  );
}

export function Interstitial({
  serial,
  nama,
  url,
}: {
  serial: string;
  nama: string;
  url: string;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-5 py-10">
      <section className="rounded-3xl border border-hairline bg-paper p-6 shadow-sm">
        <p className="w-fit rounded-full border border-hairline bg-surface-alt px-3 py-1 font-mono text-xs text-mid-gray">
          KARTU #{serial} AKTIF
        </p>
        <p className="mt-5 text-sm text-deep-gray">Kartu review untuk</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight break-words">
          {nama}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-deep-gray">
          Scan atau tap Anda diarahkan ke halaman ulasan Google toko ini.
        </p>
        <a
          href={url}
          className="mt-6 flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-paper focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Buka Ulasan Google
        </a>
        <Link
          href={`/r/${serial}/manage`}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-hairline px-5 text-sm font-semibold text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
        >
          Ganti link (butuh PIN)
        </Link>
      </section>
      <p className="text-center font-mono text-xs text-mid-gray">
        StaticCred · {serial}
      </p>
    </main>
  );
}

export function ActivationSuccess({
  serial,
  nama,
  url,
}: {
  serial: string;
  nama: string;
  url: string;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-5 py-10">
      <section className="rounded-3xl border border-hairline bg-paper p-6 shadow-sm">
        <p className="w-fit rounded-full border border-hairline bg-surface-alt px-3 py-1 font-mono text-xs text-mid-gray">
          KARTU #{serial} AKTIF
        </p>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          Kartu berhasil diaktifkan!
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-deep-gray">
          Pelanggan yang scan QR atau tap kartu langsung diarahkan ke halaman ulasan
          Google Anda.
        </p>
        <div className="mt-5 rounded-2xl border border-hairline bg-canvas p-4">
          <p className="font-mono text-xs font-semibold tracking-widest text-mid-gray uppercase">
            Tujuan ulasan
          </p>
          <p className="mt-2 font-semibold break-words">{nama}</p>
          <a
            href={url}
            className="mt-1 block font-mono text-xs break-all text-deep-gray underline decoration-hairline underline-offset-2 hover:text-ink"
          >
            {url}
          </a>
        </div>
        <Link
          href={`/r/${serial}`}
          className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-paper focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Coba buka review
        </Link>
        <p className="mt-4 text-center text-sm text-deep-gray">
          Simpan PIN Anda untuk mengganti link ulasan toko nanti.
        </p>
      </section>
      <p className="text-center font-mono text-xs text-mid-gray">
        StaticCred · {serial}
      </p>
    </main>
  );
}
