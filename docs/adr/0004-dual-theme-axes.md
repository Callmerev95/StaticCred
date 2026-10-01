# ADR-0004: Dua sumbu tema independen (app vs kartu)

- Status: accepted
- Date: 2026-09-29

## Context
`DESIGN.md` (light monokrom) konflik dengan mockup acuan awal (dark). User memutuskan: app punya dark/light, kartu punya dark/google-official. Risiko: tema app bocor ke piksel cetak, atau satu flag mengontrol keduanya.

## Decision
Dua sumbu independen:
- **Tema Aplikasi** (`light|dark`): CSS vars + Tailwind `darkMode: 'class'` + `next-themes` (system default, toggle header, persist localStorage). Hanya mewarnai chrome.
- **Tema Kartu** (`dark|google`, default `dark`): objek token TS yang masuk ke `drawCard(ctx, {..., cardTheme})`. Canvas menggambar piksel sendiri, tidak membaca CSS/DOM theme.
- Aturan kontras QR: modul gelap di atas bidang terang, selalu (tidak ada QR putih-di-hitam). ECC H.

## Consequences
- Plus: ganti tema app tidak pernah merusak output cetak (dapat dibuktikan via test hash piksel); kartu dark tampil benar di atas app light dan sebaliknya.
- Minus: dua sumber token (CSS vars + objek TS) harus dijaga konsisten manual; Zoom preview murni CSS scale agar tidak memicu re-render full-res.
