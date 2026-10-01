# CONTEXT.md - StaticCred

Single-context. Baca file ini + `docs/adr/` sebelum mengerjakan kode.

## Glosarium (gunakan istilah ini persis)
- **Kartu review**: artefak cetak berisi QR menuju form ulasan. Jangan sebut "flyer"/"banner".
- **Link Langsung**: mode QR berisi URL review asli (`search.google.com/local/writereview?placeid=…` atau URL TripAdvisor). Lawan dari Cetak Kosong.
- **Cetak Kosong**: mode kartu tanpa nama toko, QR berpola `https://<app>/r/G-XXXXXX`. Untuk stok reseller.
- **Aktivasi**: proses mengikat serial ke tujuan ulasan (nama toko + link Google + PIN) lewat Halaman Aktivasi. Sekali aktif, hanya PIN yang boleh mengubah.
- **Kartu Aktif**: serial yang sudah punya tujuan ulasan di KV. Lawan dari Pending.
- **Pending**: serial sudah terdaftar (dibuat via ID Baru / batch) tetapi belum diisi tujuan ulasannya.
- **Halaman Aktivasi**: `/r/<serial>/activate`, form yang dilihat pembeli saat scan pertama. Sukses → halaman "Kartu Berhasil Diaktifkan".
- **Interstitial**: `/r/<serial>` saat kartu aktif: konfirmasi nama toko + tombol "Buka Ulasan" + "Ganti link". Scan dihitung sekali di sini.
- **Tujuan Tulis Ulasan**: URL kanonik `search.google.com/local/writereview?placeid=…` (form tulis ulasan di Google Search, bukan Google Maps). Link yang memuat place ID `ChIJ…` otomatis di-rewrite ke tujuan ini saat dibaca maupun ditulis (`lib/review-url.ts`); link Google Maps tanpa place ID di-resolve otomatis via proxy (`lib/resolve-review.ts`, hint live 700 ms), gagal resolve → link dipakai apa adanya. Istilah lain: "generate writereview".
- **Kelola Kartu**: `/r/<serial>/manage`, gerbang PIN untuk mengubah nama/link/PIN setelah aktif. Bukan dashboard semua kartu.
- **PIN Keamanan**: 4–8 angka, hash di KV, kredensial pemilik kartu. Tanpa pemulihan: lupa PIN = link tak bisa diubah.
- **Batch**: kelompok serial yang dibuat bersamaan, berlabel `BATCH-YYYY-MM-DD`, ikut diekspor ke CSV.
- **Tema Aplikasi**: `light` / `dark` untuk chrome app (form, panel, tombol). Default ikut OS, toggle di header, persist `localStorage`. Tidak boleh memengaruhi satu piksel pun output cetak. Jangan sebut "darkmode" satu kata, selalu "Tema Aplikasi".
- **Tema Kartu**: `dark` (default, hitam elegan) / `google` (putih bersih official) untuk hasil cetak. Dipilih per kartu via segmen kontrol, masuk ke `drawCard` sebagai `cardTheme`, dipakai preview + export. Independen dari Tema Aplikasi. Jangan campur istilah keduanya.
- **Serial**: satu ID `G-XXXXXX` (G- + 6 karakter) di semua tempat (panel Cetak Kosong, QR blank, serial di kartu, URL `/r/`). Alfabet 33 karakter tanpa huruf rancu I, L, O. Hanya format 6 yang valid; format 4 lama tidak diterima. `#SC-2025-0814` di stitch hanya ilustrasi mockup, bukan format.
- **Bleed**: tambahan 3 mm tiap sisi untuk area potong. Toggle Bleed menambah canvas + crop marks.
- **DPI**: selalu 300 untuk export. Preview boleh downscale, export tidak.
- **ECC**: error correction QR, selalu level H (30% toleransi rusak).
- **Quiet zone**: margin putih ≥4 modul di sekeliling QR, wajib.
- **Varian ukuran**: `pvc-h` (85.6×54), `pvc-v` (54×85.6), `a6` (105×148), `a7` (74×105), `stiker-70` (70×70). Semua dalam mm.

## Aturan domain
- Backend terbatas di satu jalur: generator, preview, dan export tetap tanpa backend (render client-side, tanpa fetch validasi). Penyimpanan hanya Vercel KV untuk aktivasi Cetak Kosong (ADR-0005): mapping serial → {nama, url, pinHash}, counter scan, dan rate-limit. Tidak ada auth, tidak ada database lain.
- Serial yang dibuat di form langsung didaftarkan ke KV berstatus Pending (termasuk batch + label), tetapi aktivasi tetap lazy: serial valid di luar sistem tetap bisa diaktifkan. Race first-wins.
- Satu sumber render: `drawCard(ctx, opts)` dipakai preview dan export. Jangan duplikasi logika gambar.
- Pixel math: `px = round(mm × 300 / 25.4)`. Tabel resmi ada di `PRD.md §3`.
- QR Link Langsung = verbatim input user (trim saja). QR Cetak Kosong = `${appUrl}/r/${cardId}`.
- Teks kartu default (ID): Judul "Beri Ulasan di Google", Badge "TAP NFC" / "GOOGLE REVIEW", CTA "SCAN ATAU TAP DI SINI", sub-CTA "Scan QR atau tap kartu untuk beri review". Dapat dioverride via Ubah Teks Kartu.
- Yang dihindari: menyebut ID-1/ID-2/ID-3 ISO (produk memakai ukuran custom di atas, bukan ISO 7810 murni), menyimpan link di server di luar jalur aktivasi KV, mengecilkan QR di bawah versi yang masih terbaca (beri warning jika payload > ~200 char).

## Referensi visual
- `reference/stitch-reference.png`: ACUAN UTAMA layout live preview + kartu (gantikan `live-preview.png`).
- `reference/live-preview.png`: arsip (tema kartu dark versi lama).
- `reference/input-QR.png`: form Link Langsung.
- `reference/input-QR-kosong.png`: form Cetak Kosong.
- `reference/form-aktivasi.png`: acuan Halaman Aktivasi (form aktivasi).
- `reference/panduan.png`: acuan kotak Panduan terbuka (toggle inline di bawah input link).
- `DESIGN.md`: token light + Dark Theme (app) + Card Themes (cetak).
