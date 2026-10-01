# ADR-0003: Cetak Kosong sebagai pola URL placeholder

- Status: superseded by ADR-0005
- Date: 2026-09-29

## Context
Mode Cetak Kosong butuh QR `…/r/G-XXXX` yang "aktif belakangan". Tanpa backend tidak ada resolver dinamis.

## Decision
V1: QR mengkode pola URL final (`https://<app>/r/<id>`) sebagai placeholder statis. Route `/r/[id]` hanya halaman statis "belum aktif" (atau redirect manual). Aktivasi dinamis (KV/DB mapping id→URL) eksplisit non-goal V1 dan akan jadi ADR lanjutan bila backend disetujui.

## Consequences
- Plus: reseller bisa cetak stok sekarang; tidak ada klaim palsu "aktif otomatis".
- Minus: copy di UI wajib jujur ("Jika belum aktif mengarah ke halaman aktivasi") — sudah sesuai referensi.
