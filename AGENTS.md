# StaticCred

Tools cetak kartu review Google / TripAdvisor, standar cetak 300 DPI. Render client-side; aktivasi dan daftar kartu via Vercel KV.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`Callmerev95/StaticCred`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

## Project

- Stack: Next.js + TypeScript + Canvas native + Vercel KV (aktivasi, daftar kartu).
- Alur: paste link review → live preview → download PNG / PDF siap cetak.
- Ukuran: PVC horizontal 85.6×54, PVC vertikal 54×85.6, Standee A6 105×148, Standee A7 74×105, Stiker 70×70 (mm, 300 DPI).
- Mode QR: `Link Langsung` (URL review asli di QR) dan `Cetak Kosong` (QR pola `…/r/G-XXXXXX`, aktivasi via KV, lihat ADR-0005).
- Detail domain: lihat `CONTEXT.md`. Kebutuhan produk: lihat `PRD.md`. Acuan UI/UX: lihat `DESIGN.md`. Keputusan arsitektur: lihat `docs/adr/`.

<!-- antislop:start -->
## antislop
Mode: DURING. Dial awal: ENERGY 2 / RHYTHM 2 / MOTION 1. Nyatakan Design Read sebelum kerja UI.
Load skill inti + sub-skill sesuai tugas via skill tool:
- Core filter, selalu on: `antislop`
- UI / visual: `antislop-ui`
- Copy & text (termasuk larangan em dash R-02): `antislop-copywriting`
- People (kontras, keyboard, fokus): `antislop-human`
- Mobile / responsive: `antislop-layoutmobile`
- Code comments: `antislop-code`
Jalankan Delivery Gate (PASS/FAIL per item + bukti) sebelum menyelesaikan kerja UI.
<!-- antislop:end -->
