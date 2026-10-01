# ADR-0005: Aktivasi kartu kosong via Vercel KV

- Status: accepted
- Date: 2026-10-01
- Supersedes: ADR-0003

## Context
ADR-0003 memutuskan QR Cetak Kosong hanya pola URL placeholder tanpa resolver, sehingga setiap kartu tercetak berujung halaman mati. Janji produk "stok reseller, aktivasi belakangan oleh pembeli" (PRD §2) tidak pernah terwujud. Referensi `reference/form-aktivasi.png` + `reference/panduan.png` menunjukkan alur aktivasi yang diinginkan: buyer scan → form isi nama toko, link Google Maps, PIN → kartu aktif → scan berikutnya diarahkan ke review.

## Decision
Pakai Vercel KV/Upstash Redis sebagai satu-satunya storage mapping `serial → {nama, url, pinHash, createdAt, updatedAt}`. Route Next.js App Router:

- `/r/[id]`: belum aktif: 307 ke `/r/[id]/activate?isNew=true`. Aktif: halaman interstitial konfirmasi (nama toko + "Buka Ulasan" + "Ganti link"), scan dihitung sekali di sini tanpa menyimpan IP.
- `/r/[id]/activate`: form aktivasi; sukses → halaman "Kartu Berhasil Diaktifkan" + pengingat simpan PIN. Link tujuan divalidasi server-side (pola Google Maps/Review), ID format salah → 404.
- `/r/[id]/manage`: gerbang PIN server-side (hash scrypt), edit nama/link/PIN + tampil total scan.
- **Tujuan kanonik**: link tujuan diarahkan ke form tulis ulasan di Google Search (`search.google.com/local/writereview?placeid=…`) selama URL memuat place ID (`ChIJ…`). Berlaku saat membaca (`/r/[id]`, Link Langsung) dan saat menulis (aktivasi/manage). Tanpa place ID, link dipakai apa adanya tanpa API key (lihat `lib/review-url.ts`).

Aturan domain: aktivasi **lazy** (ID valid format apa pun bisa diaktifkan), tapi setiap ID yang dibuat di form ("ID Baru" maupun batch 50) langsung didaftarkan ke KV berstatus `pending` + label `BATCH-YYYY-MM-DD` agar stok tercetak terklaim sejak awal. Race first-wins. Anti-abuse: rate-limit counter IP di KV (≈10 aktivasi/jam/IP), lockout 5 gagal PIN → jeda 15 menit per serial, tanpa Turnstile, tanpa pemulihan PIN. Basis URL cetak = `NEXT_PUBLIC_APP_URL` (fallback origin) dengan peringatan UI bila origin ≠ env.

## Considered Options
- **Tanpa backend (tetap ADR-0003)**: ditolak karena kartu selamanya menuju halaman mati.
- **Supabase/Postgres**: ditolak, pola akses hanya GET/SET satu key per serial, tidak butuh relational query.
- **Dashboard `/cards` publik seperti referensi**: ditolak, membocorkan semua link tujuan klien. Cek status cukup via `/manage`.
- **Serial tetap 4 karakter**: ditolak, ruang ID 1,19 juta terlalu kecil untuk enumerasi; repo belum pernah ter-cetak nyata sehingga perpanjangan ke 6 murah sekarang.

## Consequences
- Plus: stok reseller benar-benar jadi produk; batch + ekspor CSV; angka scan kasar untuk reseller.
- Minus: tidak lagi "zero backend" untuk jalur aktivasi (generator tetap tanpa backend); butuh env `KV_*` + `NEXT_PUBLIC_APP_URL`; PIN tanpa pemulihan (lupa PIN = link tak bisa diubah, copy di UI wajib mengingatkan menyimpan PIN); angka scan bisa membengkak oleh crawler.
