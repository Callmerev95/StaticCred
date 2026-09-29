# CONTEXT.md - StaticCred

Single-context. Baca file ini + `docs/adr/` sebelum mengerjakan kode.

## Glosarium (gunakan istilah ini persis)
- **Kartu review**: artefak cetak berisi QR menuju form ulasan. Jangan sebut "flyer"/"banner".
- **Link Langsung**: mode QR berisi URL review asli (`search.google.com/local/writereview?placeid=…` atau URL TripAdvisor). Lawan dari Cetak Kosong.
- **Cetak Kosong**: mode kartu tanpa nama toko, QR berpola `https://<app>/r/G-XXXX`. Untuk stok reseller.
- **Tema Aplikasi**: `light` / `dark` untuk chrome app (form, panel, tombol). Default ikut OS, toggle di header, persist `localStorage`. Tidak boleh memengaruhi satu piksel pun output cetak. Jangan sebut "darkmode" satu kata, selalu "Tema Aplikasi".
- **Tema Kartu**: `dark` (default, hitam elegan) / `google` (putih bersih official) untuk hasil cetak. Dipilih per kartu via segmen kontrol, masuk ke `drawCard` sebagai `cardTheme`, dipakai preview + export. Independen dari Tema Aplikasi. Jangan campur istilah keduanya.
- **Serial**: satu ID `G-XXXX` di semua tempat (panel Cetak Kosong, QR blank, serial di kartu). Alfabet tanpa huruf rancu I, L, O. `#SC-2025-0814` di stitch hanya ilustrasi mockup, bukan format.
- **Bleed**: tambahan 3 mm tiap sisi untuk area potong. Toggle Bleed menambah canvas + crop marks.
- **DPI**: selalu 300 untuk export. Preview boleh downscale, export tidak.
- **ECC**: error correction QR, selalu level H (30% toleransi rusak).
- **Quiet zone**: margin putih ≥4 modul di sekeliling QR, wajib.
- **Varian ukuran**: `pvc-h` (85.6×54), `pvc-v` (54×85.6), `a6` (105×148), `a7` (74×105), `stiker-70` (70×70). Semua dalam mm.

## Aturan domain
- Zero backend: tidak ada fetch validasi, tidak ada penyimpanan. Semua di `localStorage` (opsional) + state React.
- Satu sumber render: `drawCard(ctx, opts)` dipakai preview dan export. Jangan duplikasi logika gambar.
- Pixel math: `px = round(mm × 300 / 25.4)`. Tabel resmi ada di `PRD.md §3`.
- QR Link Langsung = verbatim input user (trim saja). QR Cetak Kosong = `${appUrl}/r/${cardId}`.
- Teks kartu default (ID): Judul "Beri Ulasan di Google", Badge "TAP NFC" / "GOOGLE REVIEW", CTA "SCAN ATAU TAP DI SINI", sub-CTA "Scan QR atau tap kartu untuk beri review". Dapat dioverride via Ubah Teks Kartu.
- Yang dihindari: menyebut ID-1/ID-2/ID-3 ISO (produk memakai ukuran custom di atas, bukan ISO 7810 murni), menyimpan link di server, mengecilkan QR di bawah versi yang masih terbaca (beri warning jika payload > ~200 char).

## Referensi visual
- `reference/stitch-reference.png`: ACUAN UTAMA layout live preview + kartu (gantikan `live-preview.png`).
- `reference/live-preview.png`: arsip (tema kartu dark versi lama).
- `reference/input-QR.png`: form Link Langsung.
- `reference/input-QR-kosong.png`: form Cetak Kosong.
- `DESIGN.md`: token light + Dark Theme (app) + Card Themes (cetak).
