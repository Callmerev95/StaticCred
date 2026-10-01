import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <section className="rounded-3xl border border-hairline bg-paper p-6 shadow-sm">
        <p className="font-mono text-xs font-semibold tracking-widest text-mid-gray uppercase">
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Kartu tidak dikenal</h1>
        <p className="mt-3 text-sm leading-relaxed text-deep-gray">
          Serial di alamat ini tidak ada atau salah format. Serial StaticCred
          berformat G- lalu enam angka atau huruf, tanpa huruf I, L, dan O.
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
