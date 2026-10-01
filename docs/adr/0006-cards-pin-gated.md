# ADR-0006: Daftar kartu /cards di balik gerbang PIN admin

- Status: accepted
- Date: 2026-10-01
- Amends: ADR-0005 (penolakan dashboard publik tetap berlaku)

## Context
Pemilik butuh satu halaman berisi total kartu terbit, total aktif, total pending, dan daftar per serial (nama, status, scan, link kelola). ADR-0005 menolak dashboard publik karena membocorkan link tujuan klien. Kebutuhan pelaporan tetap nyata, jadi halaman boleh ada hanya bila tidak bisa dibuka publik.

## Decision
Route `/cards` (server, `force-dynamic`, `robots index false`):

- Akses di balik PIN admin global dari env `ADMIN_PIN` (server-only). Tanpa cookie sesi valid, halaman hanya menampilkan form PIN; benar → cookie httpOnly `cards_admin = ts.hmac(ADMIN_PIN)` 12 jam, `timingSafeEqual` di kedua sisi.
- Tanpa `ADMIN_PIN` atau tanpa KV, halaman menampilkan kondisi jujur (belum dikonfigurasi), bukan daftar kosong.
- Data dari `listCards` (`lib/store.ts`): `SCAN card:*` + `SCAN pend:*` (cursor bertahap), dedupe dengan aktif menang (klaim tidak menghapus `pend:`), `GET` batch via pipeline. Kolom "terakhir scan" dari referensi sengaja dihilangkan: skema tidak menyimpannya dan satu write tambahan per scan tidak dibenarkan kebutuhannya.
- Pipeline wajib ke endpoint `<url>/pipeline` Upstash; array yang dikirim ke base URL ditolak server ("unsupported arg type"). Perintah tunggal (GET/SCAN) tetap ke base URL. Database gagal dibaca menampilkan error state jujur + tombol muat ulang, bukan crash digest.
- Statistik (Total Terbit, Aktif, Pending, Total Scan) dan filter Semua/Aktif/Pending dihitung dari hasil yang sama, tanpa fetch ulang.
- Copas link aktivasi via tombol Salin Link per baris pending.

## Considered Options
- **Publik tanpa PIN seperti referensi**: ditolak, melanggar ADR-0005 (link tujuan klien bocor ke siapa pun).
- **PIN per kartu untuk membuka /cards**: ditolak, PIN kartu milik pembeli toko, bukan pemilik; satu PIN admin global sesuai peran.
- **Kolom terakhir scan**: ditolak untuk sekarang, butuh key `scanlast:*` baru + write tiap scan. Tambahkan bila pemilik benar butuh, bukan spekulasi.

## Consequences
- Plus: pemilik melihat stok dan performa tanpa membuka tiap `/manage`.
- Minus: butuh env `ADMIN_PIN`; `SCAN` keyspace O(n) tiap buka halaman (aman di skala reseller, tanpa indeks baru karena pola akses tetap per-key).
