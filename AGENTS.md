# StaticCred

Tools cetak kartu review Google / TripAdvisor, standar cetak 300 DPI, zero backend.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`Callmerev95/StaticCred`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

## Project

- Stack: Next.js + TypeScript + Canvas native, tanpa backend.
- Alur: paste link review → live preview → download PNG / PDF siap cetak.
- Ukuran: PVC horizontal 85.6×54, PVC vertikal 54×85.6, Standee A6 105×148, Standee A7 74×105, Stiker 70×70 (mm, 300 DPI).
- Mode QR: `Link Langsung` (URL review asli di QR) dan `Cetak Kosong` (QR pola `…/r/G-XXXX`, aktivasi belakangan).
- Detail domain: lihat `CONTEXT.md`. Kebutuhan produk: lihat `PRD.md`. Acuan UI/UX: lihat `DESIGN.md` + `reference/`. Keputusan arsitektur: lihat `docs/adr/`.
