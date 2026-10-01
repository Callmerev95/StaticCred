# ADR-0001: Canvas native, zero backend

- Status: accepted
- Date: 2026-09-29

## Context
Butuh render print-quality 300 DPI tanpa server agar murah (Vercel static) dan privasi link terjaga. Alternatif: backend render (Puppeteer/Satori) atau lib kanvas berat (Fabric/Konva).

## Decision
Next.js App Router + TypeScript + Canvas 2D native + lib minimal (`qrcode` untuk encode, `jspdf` untuk bungkus PDF). Semua render client-side.

## Consequences
- Plus: tanpa biaya server, offline-capable, kontrol piksel penuh.
- Minus: tidak ada validasi Place ID server-side; aktivasi kartu kosong butuh layanan terpisah nanti (terwujud di ADR-0005: hanya jalur aktivasi yang pakai backend, render cetak tetap client-side). Payload QR panjang ditangani di client (warning versi QR).
