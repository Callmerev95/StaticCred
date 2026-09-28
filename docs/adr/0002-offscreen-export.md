# ADR-0002: Offscreen full-res + preview downscale, satu drawCard

- Status: accepted
- Date: 2026-09-29

## Context
Preview di layar (~400px) vs export 300 DPI (hingga 1311×1819). Duplikasi kode gambar rawan drift.

## Decision
Satu fungsi murni `drawCard(ctx, opts)` dipakai dua canvas: offscreen full-res (export) dan canvas preview (di-scale via CSS, `imageSmoothingQuality: high`). Semua koordinat dihitung dalam piksel export, bukan piksel layar. Bleed = perluas canvas + gambar crop marks di dalam fungsi yang sama, dikontrol flag.

## Consequences
- Plus: preview = WYSIWYG, test cukup snapshot satu fungsi.
- Minus: render full-res tiap keystroke berat → debounce input + rAF throttle.
