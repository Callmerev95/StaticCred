# StaticCred - Review Card Printer

Tools web untuk mencetak kartu / standee / stiker ajakan review Google & TripAdvisor. Paste link → live preview → download PNG + PDF siap cetak 300 DPI. Zero backend, render penuh di browser via Canvas API.

## Fitur (V1)
- 5 varian ukuran siap cetak 300 DPI (lihat tabel di bawah).
- Dua mode QR: `Link Langsung` (QR = URL review asli) dan `Cetak Kosong` (QR berpola `…/r/G-XXXXXX` untuk stok reseller).
- Aktivasi Cetak Kosong: buyer scan → form (`/r/[id]/activate`) isi nama toko, link Google Maps, PIN → kartu aktif → scan berikutnya tampil konfirmasi nama toko sebelum buka ulasan. Ubah link lewat `/r/[id]/manage` (PIN). Batch "Buat 50 ID" + ekspor CSV untuk reseller.
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

Env (wajib untuk jalur aktivasi, lihat `docs/adr/0005-blank-card-activation-kv.md`):

```bash
NEXT_PUBLIC_APP_URL=https://<domain-produksi>   # basis URL cetak; fallback = origin runtime
KV_REST_API_URL=...                             # Vercel KV / Upstash Redis
KV_REST_API_TOKEN=...
```

Deploy: Vercel. Generator/preview/export tetap berjalan tanpa env (render client-side); tanpa KV, route `/r/*` hanya akan menampilkan kondisi "belum aktif".

## Alur pakai
1. Pilih ukuran → 2. Isi Data Usaha & Link Review (tab Link Langsung / Cetak Kosong) → 3. Atur teks + tampilan → 4. Cek live preview → 5. Download PNG / PDF.

## Struktur repo

```
├── AGENTS.md            # aturan agen + skill
├── PRD.md               # kebutuhan produk + acceptance
├── CONTEXT.md           # glosarium domain
├── docs/
│   ├── agents/          # konfigurasi issue tracker, triage, domain
│   └── adr/             # keputusan arsitektur (0001–0005)
├── reference/           # mockup UI acuan (input-QR, live-preview, form-aktivasi, panduan)
├── app/                 # Next.js App Router: / , /r/[id], /r/[id]/activate, /r/[id]/manage
├── lib/                 # sizes.ts, qr.ts, render-card.ts, store.ts (KV aktivasi)
└── components/          # SizePicker, BusinessForm, LivePreview, ExportButtons
```

## Dokumen
- Kebutuhan: `PRD.md`. Istilah: `CONTEXT.md`. Acuan UI/UX: `DESIGN.md` + `reference/`. Arsitektur: `docs/adr/`.
- Kerja agen: `AGENTS.md` + `docs/agents/`.

## Kredit aset
- Ikon contactless pada pill TAP NFC: Contactless icon from Flaticon (ID 6107543).
- Badge centang "Google Verified": Verified badge icon from Flaticon (ID 7641727).

## Kontribusi / tiket
Tiket hidup di GitHub Issues (`Callmerev95/StaticCred`), label triase: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Tiket awal: #1–#8.

## Batasan V1
- Tanpa env KV, route `/r/*` menampilkan kondisi "belum aktif" yang jujur (tanpa form aktivasi): bukan 404.
- Dashboard `/cards` tidak ada di V1; cek status per kartu via `/r/[id]/manage`.
- Validasi link bersifat ringan (paste bebas, tanpa fetch API Google/TripAdvisor); link tujuan tetap divalidasi pola server-side saat aktivasi.
