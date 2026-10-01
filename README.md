# StaticCred — Cetak Kartu Review Google & TripAdvisor 300 DPI

Tools web untuk UMKM mencetak kartu, standee, dan stiker ajakan review Google & TripAdvisor. Tempel link review, atur tampilan di live preview, lalu unduh PNG atau PDF siap cetak 300 DPI. Generator, preview, dan export berjalan penuh di browser via Canvas API, tanpa upload ke server.

**Live:** https://static-cred.vercel.app

## Fitur

- **5 varian ukuran siap cetak 300 DPI** (lihat tabel di bawah).
- **Dua mode QR:** `Link Langsung` (QR berisi URL review asli) dan `Cetak Kosong` (QR berpola `…/r/G-XXXXXX` untuk stok reseller yang diaktivasi belakangan oleh pembeli).
- **Aktivasi Cetak Kosong:** pembeli scan → form aktivasi (`/r/[id]/activate`) isi nama toko, link Google Maps, dan PIN → kartu aktif → scan berikutnya menampilkan konfirmasi nama toko sebelum membuka ulasan. Ubah link kapan saja lewat `/r/[id]/manage` (gerbang PIN). Batch "Buat 50 ID" + ekspor CSV untuk reseller.
- **Daftar kartu pemilik (`/cards`):** total kartu terbit, aktif, pending, dan total scan, plus filter dan tombol kelola per kartu. Di balik PIN admin, bukan halaman publik.
- **Live preview WYSIWYG** dengan toggle 5 Bintang, Ikon NFC, Serial ID, dan Bleed (3 mm + crop marks).
- **Dua Tema Kartu independen** (`dark` elegan dan `google` official) yang tidak terpengaruh Tema Aplikasi.
- **Export PNG** (dimensi piksel tepat) dan **PDF** (ukuran milimeter tepat, embed PNG 1:1).

## Ukuran

| Varian | mm | px @300DPI | +bleed 3mm/sisi |
|---|---|---|---|
| PVC Horizontal | 85.6 × 54 | 1011 × 638 | 1082 × 709 |
| PVC Vertikal | 54 × 85.6 | 638 × 1011 | 709 × 1082 |
| Standee A6 | 105 × 148 | 1240 × 1748 | 1311 × 1819 |
| Standee A7 | 74 × 105 | 874 × 1240 | 945 × 1311 |
| Stiker Kasir | 70 × 70 | 827 × 827 | 898 × 898 |

Rumus: `px = round(mm × 300 / 25.4)`.

## Cara pakai

1. Pilih ukuran kartu.
2. Isi Data Usaha & Link Review (tab Link Langsung atau Cetak Kosong).
3. Atur teks kartu dan tampilan (bintang, NFC, serial, bleed).
4. Cek live preview.
5. Unduh PNG atau PDF.

## Menjalankan lokal

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # cek build hijau sebelum deploy
```

Env (wajib untuk jalur aktivasi dan daftar kartu, lihat `docs/adr/0005-blank-card-activation-kv.md`):

```bash
NEXT_PUBLIC_APP_URL=https://<domain-produksi>   # basis URL cetak + kanonis SEO; fallback = origin runtime
KV_REST_API_URL=...                             # Vercel KV / Upstash Redis
KV_REST_API_TOKEN=...
ADMIN_PIN=...                                   # PIN admin halaman /cards (server-only)
```

Deploy di Vercel. Tanpa KV, route `/r/*` hanya menampilkan kondisi "belum aktif" yang jujur. Tanpa `ADMIN_PIN`, halaman `/cards` hanya menampilkan pesan belum dikonfigurasi.

## Arsitektur singkat

- **Rendering:** satu fungsi `drawCard(ctx, opts)` di `lib/render-card.ts` dipakai preview dan export, tanpa duplikasi. QR ECC level H dengan quiet zone 4 modul.
- **Storage:** satu-satunya storage adalah Vercel KV / Upstash Redis untuk aktivasi Cetak Kosong (`card:<id>` aktif, `pend:<id>` stok pending, `scan:<id>` hitungan). Generator dan export tidak menyentuh network.
- **Keputusan arsitektur:** lihat `docs/adr/` (0001 canvas-native, 0002 offscreen-export, 0004 dual-theme, 0005 aktivasi KV, 0006 daftar kartu ber-PIN).
- **SEO:** metadata Open Graph + Twitter + canonical terpusat di `lib/site.ts`; `robots.ts` hanya mengizinkan home; `/cards`, `/r/*`, dan `/api/*` selalu `noindex`.

## Struktur repo

```
├── AGENTS.md            # aturan agen + skill
├── PRD.md               # kebutuhan produk + acceptance
├── CONTEXT.md           # glosarium domain
├── DESIGN.md            # acuan UI/UX + token kartu cetak
├── docs/
│   ├── agents/          # konfigurasi issue tracker, triage, domain
│   └── adr/             # keputusan arsitektur (0001–0006)
├── app/                 # Next.js App Router: / , /cards, /r/[id], /r/[id]/activate, /r/[id]/manage
├── lib/                 # sizes, qr, render-card, store (KV), site (SEO)
└── components/          # SiteNav, BusinessForm, LivePreview, ExportButtons, cards, activation
```

## Dokumen

- Kebutuhan: `PRD.md`. Istilah: `CONTEXT.md`. Acuan UI/UX: `DESIGN.md`. Arsitektur: `docs/adr/`.
- Kerja agen: `AGENTS.md` + `docs/agents/`.

## Kredit aset

- Ikon contactless pada pill TAP NFC: Contactless icon from Flaticon (ID 6107543).
- Badge centang "Google Verified": Verified badge icon from Flaticon (ID 7641727).

## Kontribusi / tiket

Tiket hidup di GitHub Issues (`Callmerev95/StaticCred`), label triase: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Tiket awal: #1–#8.

## Batasan V1

- Tanpa env KV, route `/r/*` menampilkan kondisi "belum aktif" yang jujur (tanpa form aktivasi): bukan 404.
- Daftar kartu `/cards` hanya di balik PIN admin (`ADMIN_PIN`); tanpa PIN/KV tampil kondisi jujur. Versi publik tetap tidak ada; cek status per kartu via `/r/[id]/manage`.
- Validasi link bersifat ringan (paste bebas, tanpa fetch API Google/TripAdvisor); link tujuan tetap divalidasi pola server-side saat aktivasi.
