// Kelas Tailwind bersama untuk chrome app (bukan kartu cetak).
// Satu sumber agar label, tombol, dan error tidak drift antar halaman.

export const LABEL_FIELD =
  "font-mono text-xs font-semibold tracking-widest text-ink uppercase";

export const LABEL_EYEBROW =
  "font-mono text-xs font-semibold tracking-widest text-mid-gray uppercase";

export const LABEL_CAPTION = "font-mono text-xs text-mid-gray";

export const H2_PRIMARY = "text-lg font-semibold";

export const H2_PANEL = "text-base font-semibold";

export const BTN_PRIMARY =
  "inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-paper transition-opacity focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export const BTN_SECONDARY =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-hairline px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-alt focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none";

export const BTN_SMALL =
  "inline-flex min-h-9 items-center rounded-full border border-hairline px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-alt focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none";

export const PILL_META =
  "rounded-full border border-hairline bg-canvas px-3 py-1 font-mono text-xs text-deep-gray";

export const ERROR_BOX =
  "mt-4 rounded-2xl border border-ember/40 bg-ember/5 px-4 py-3 text-sm text-ember";
