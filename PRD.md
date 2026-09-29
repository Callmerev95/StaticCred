# PRD — StaticCred Review Card Printer

## 1. Ringkasan
Tools web untuk UMKM mencetak kartu / standee / stiker ajakan review Google & TripAdvisor. Paste link → live preview → download PNG + PDF siap cetak 300 DPI. Zero backend, 100% render di browser via Canvas API.

Referensi UI: `reference/input-QR.png`, `reference/input-QR-kosong.png`, `reference/live-preview.png`.

## 2. Pengguna
- Pemilik usaha (cetak untuk tokonya sendiri, mode `Link Langsung`).
- Reseller (cetak stok kosong tanpa nama toko, mode `Cetak Kosong`, aktivasi belakangan oleh pembeli).

## 3. Scope V1
### Masuk
- 5 varian ukuran (mm, 300 DPI):
  | Varian | mm | px @300DPI | +bleed 3mm/sisi |
  |---|---|---|---|
  | PVC Horizontal | 85.6×54 | 1011×638 | 1081×709 |
  | PVC Vertikal | 54×85.6 | 638×1011 | 709×1081 |
  | Standee A6 | 105×148 | 1240×1748 | 1311×1819 |
  | Standee A7 | 74×105 | 874×1240 | 945×1311 |
  | Stiker Kasir | 70×70 | 827×827 | 897×897 |
- Mode QR ganda: `Link Langsung` (QR = URL review asli) dan `Cetak Kosong` (QR = pola `https://<app>/r/G-XXXX`, ID kartu `G-` + 4 base32, tombol ID Baru + Buka Link).
- Form: link review (Google Maps `writereview?placeid=` + TripAdvisor, paste bebas V1), nama usaha (max 60 char + counter), collapsible Ubah Teks Kartu (Judul, Badge, CTA), toggle: 5 Bintang, Ikon NFC, Serial ID, Bleed.
- Live preview WYSIWYG + toggle: 5 Bintang, Ikon NFC, Serial ID, Bleed (3 mm + crop marks). Layout mengikuti `reference/stitch-reference.png`: badge dimensi dinamis, kontrol zoom 75%/100%/Fit (CSS scale), dotted background, footer `Output Piksel` + `Salin Ringkasan` + `Reset Form`.
- Tema ganda independen: Tema Aplikasi (light/dark, system + toggle) hanya untuk chrome; Tema Kartu (`dark` default / `google` official) untuk hasil cetak via segmen kontrol. Spesifikasi: `DESIGN.md` § Dark Theme + § Card Themes.
- Export: PNG dimensi piksel tepat + PDF ukuran mm tepat (embed PNG, bukan raster ulang).
- Stack: Next.js (App Router) + TypeScript + Canvas native + Tailwind. Deploy Vercel.

### Keluar (non-goals V1)
- Aktivasi dinamis `/r/:id` (butuh backend/KV — V1 hanya pola URL placeholder, lihat ADR-0003).
- Fetch/validasi Place ID via Google API, scraping TripAdvisor.
- Editor drag-and-drop, multi-bahasa, auth, pembayaran.

## 4. Alur pengguna
1. Pilih ukuran → 2. Isi Data Usaha & Link Review (tab Link Langsung / Cetak Kosong) → 3. Atur teks + tampilan → 4. Live preview → 5. Download PNG / PDF.

## 5. Acceptance criteria
- [ ] Paste link Google/TripAdvisor → QR preview berubah <300ms (debounced), ECC level H, quiet zone ≥4 modul.
- [ ] Nama usaha >60 char ditolak + counter akurat.
- [ ] Cetak Kosong: ID Baru selalu unik per sesi (tidak collision), tanpa nama toko di kartu.
- [ ] Toggle 5 Bintang / NFC / Serial / Bleed tampil-sembunyi real-time di preview maupun export.
- [ ] PNG diekspor pada resolusi tabel §3 persis (byte-check dimensi).
- [ ] PDF berukuran mm persis per varian (boleh dicek di Acrobat preflight).
- [ ] Tidak ada request network selain navigasi/CDN — verified via DevTools offline.
- [ ] Toggle Tema Aplikasi light/dark tidak mengubah satu piksel output PNG (render export di kedua tema, hash sama).
- [ ] Kedua Tema Kartu lolos kontras teks dan QR terbaca pemindai pada cetak 1:1.
- [ ] Zoom 75/100/Fit hanya CSS scale; badge dimensi + footer piksel selalu cocok tabel PRD.
- [ ] Ganti Tema Kartu dark/google <300ms di preview maupun export.
- [ ] Lighthouse performance ≥90 di desktop.

## 6. Risiko teknis
- Canvas print-quality: teks kecil pecah → mitigasi: render offscreen full-res, font sans tebal, hindari skala fraksional (ADR-0002).
- QR URL Google panjang (~80 char) → mitigasi ECC H + ukuran modul minimum, fallback peringatan jika versi QR >10.
- PDF presisi mm: jsPDF rounding → mitigasi: set unit mm + ukuran custom array, embed PNG 300 DPI 1:1.

## 7. Tiket awal (dipetakan ke GitHub Issues)
1. Scaffold Next.js + TS + Tailwind + struktur `lib/`/`components/`
2. `lib/sizes.ts` + tabel DPI/bleed + unit test
3. `lib/qr.ts` + generator ID + validator link + test
4. `lib/render-card.ts` drawCard murni (preview + export satu sumber)
5. Form dual-mode (Link Langsung / Cetak Kosong) sesuai referensi
6. LivePreview + toggles + overrides teks
7. Export PNG + PDF 300 DPI
8. Polish a11y/responsive + deploy Vercel
