# StaticCred - Review Card Printer

Tools web untuk mencetak kartu / standee / stiker ajakan review Google & TripAdvisor. Paste link → live preview → download PNG + PDF siap cetak 300 DPI. Zero backend, render penuh di browser via Canvas API.

## Fitur (V1)
- 5 varian ukuran siap cetak 300 DPI (lihat tabel di bawah).
- Dua mode QR: `Link Langsung` (QR = URL review asli) dan `Cetak Kosong` (QR berpola `…/r/G-XXXX` untuk stok reseller, aktivasi belakangan).
- Live preview WYSIWYG + toggle: 5 Bintang, Ikon NFC, Serial ID, Bleed (3 mm + crop marks).
- Export PNG (dimensi piksel tepat) + PDF (ukuran mm tepat).
- Tanpa server: tidak ada upload link ke mana pun.

## Ukuran

| Varian | mm | px @300DPI | +bleed 3mm/sisi |
|---|---|---|---|
| PVC Horizontal | 85.6×54 | 1011×638 | 1081×709 |
| PVC Vertikal | 54×85.6 | 638×1011 | 709×1081 |
| Standee A6 | 105×148 | 1240×1748 | 1311×1819 |
| Standee A7 | 74×105 | 874×1240 | 945×1311 |
| Stiker Kasir | 70×70 | 827×827 | 897×897 |

Rumus: `px = round(mm × 300 / 25.4)`.

## Quickstart

> Scaffold Next.js belum dijalankan (tiket #1). Setelah scaffold:

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # cek build hijau sebelum deploy
```

Deploy: Vercel (static, tanpa env apa pun).

## Alur pakai
1. Pilih ukuran → 2. Isi Data Usaha & Link Review (tab Link Langsung / Cetak Kosong) → 3. Atur teks + tampilan → 4. Cek live preview → 5. Download PNG / PDF.

## Struktur repo

```
├── AGENTS.md            # aturan agen + skill
├── PRD.md               # kebutuhan produk + acceptance
├── CONTEXT.md           # glosarium domain
├── docs/
│   ├── agents/          # konfigurasi issue tracker, triage, domain
│   └── adr/             # keputusan arsitektur (0001–0003)
├── reference/           # mockup UI acuan (input-QR, live-preview)
├── app/                 # (setelah scaffold) Next.js App Router
├── lib/                 # sizes.ts, qr.ts, render-card.ts
└── components/          # SizePicker, BusinessForm, LivePreview, ExportButtons
```

## Dokumen
- Kebutuhan: `PRD.md`. Istilah: `CONTEXT.md`. Acuan UI/UX: `DESIGN.md` + `reference/`. Arsitektur: `docs/adr/`.
- Kerja agen: `AGENTS.md` + `docs/agents/`.

## Kontribusi / tiket
Tiket hidup di GitHub Issues (`Callmerev95/StaticCred`), label triase: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Tiket awal: #1–#8.

## Batasan V1
- Route `/r/G-XXXX` hanya placeholder statis (halaman "belum aktif"). Aktivasi dinamis butuh backend, di luar scope V1 (lihat `docs/adr/0003-blank-card-placeholder.md`).
- Validasi link bersifat ringan (paste bebas, tanpa fetch API Google/TripAdvisor).
