const steps = [
  "Pilih ukuran — PVC, Standee A6/A7, Stiker 70×70",
  "Isi link review + nama usaha (Link Langsung / Cetak Kosong)",
  "Atur teks & tampilan, pilih Tema Kartu",
  "Download PNG / PDF 300 DPI siap cetak",
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="rounded-full border border-hairline bg-paper px-3 py-1 text-xs font-medium text-mid-gray">
          Zero backend · 300 DPI · Canvas native
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          StaticCred Review Card Printer
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-mid-gray">
          Paste link review Google / TripAdvisor, atur kartu di live preview,
          lalu download PNG atau PDF siap cetak. Scaffold awal — alur penuh
          menyusul di tiket #2–#7.
        </p>
      </div>
      <ol className="w-full rounded-3xl border border-hairline bg-paper p-5 shadow-sm">
        {steps.map((step, i) => (
          <li
            key={step}
            className="flex items-baseline gap-3 border-b border-hairline py-3 text-sm last:border-0"
          >
            <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-xs text-paper">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </main>
  );
}
