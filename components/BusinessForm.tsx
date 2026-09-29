"use client";

import { useId } from "react";
import { blankCardUrl, checkReviewLink, generateCardId } from "@/lib/qr";
import {
  BUSINESS_NAME_MAX,
  type CardFormState,
  type FormMode,
} from "@/lib/form-state";

interface BusinessFormProps {
  state: CardFormState;
  onChange: (patch: Partial<CardFormState>) => void;
  appUrl: string;
}

const MODES: Array<{ id: FormMode; label: string }> = [
  { id: "direct", label: "Link Langsung" },
  { id: "blank", label: "Cetak Kosong" },
];

function FieldLabel({
  htmlFor,
  children,
  aside,
}: {
  htmlFor: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <label
        htmlFor={htmlFor}
        className="font-mono text-xs font-medium tracking-widest text-ink uppercase"
      >
        {children}
      </label>
      {aside}
    </div>
  );
}

function Toggle({
  checked,
  onToggle,
  label,
  icon,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <label className="min-h-11 flex cursor-pointer items-center gap-1.5 rounded-2xl border border-hairline bg-paper px-2.5 py-2 text-ink transition-colors has-checked:border-ink has-checked:bg-surface-alt has-focus-visible:ring-2 has-focus-visible:ring-ink has-focus-visible:ring-offset-2">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onToggle}
      />
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${
          checked ? "border-ink bg-ink text-paper" : "border-hairline bg-paper"
        }`}
      >
        {checked ? "✓" : ""}
      </span>
      <span aria-hidden="true" className="shrink-0">
        {icon}
      </span>
      <span className="text-[13px] leading-snug font-medium">{label}</span>
    </label>
  );
}

export default function BusinessForm({ state, onChange, appUrl }: BusinessFormProps) {
  const uid = useId();
  const activeIndex = Math.max(
    0,
    MODES.findIndex((m) => m.id === state.mode),
  );
  const link = checkReviewLink(state.reviewLink);
  const hasLink = state.reviewLink.trim().length > 0;

  const selectMode = (mode: FormMode) => {
    onChange({ mode });
  };

  const onTabKeyDown = (e: React.KeyboardEvent) => {
    const last = MODES.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (activeIndex + 1) % MODES.length;
    if (e.key === "ArrowLeft") next = (activeIndex + last) % MODES.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = last;
    if (next !== null) {
      e.preventDefault();
      selectMode(MODES[next].id);
      document.getElementById(`${uid}-tab-${MODES[next].id}`)?.focus();
    }
  };

  const blankUrl =
    state.mode === "blank" && state.cardId.trim()
      ? blankCardUrl(appUrl || "https://contoh.app", state.cardId)
      : "";

  const linkInputId = `${uid}-link`;
  const nameInputId = `${uid}-name`;

  return (
    <section
      aria-labelledby={`${uid}-heading`}
      className="rounded-3xl border border-hairline bg-paper p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink font-mono text-sm font-semibold text-paper"
        >
          2
        </span>
        <h2 id={`${uid}-heading`} className="text-lg font-semibold">
          Data Usaha {"&"} Link Review
        </h2>
      </div>

      <div
        role="tablist"
        aria-label="Mode kartu"
        onKeyDown={onTabKeyDown}
        className="mb-6 grid grid-cols-2 gap-1 rounded-full border border-hairline bg-canvas p-1"
      >
        {MODES.map((m) => {
          const selected = state.mode === m.id;
          return (
            <button
              key={m.id}
              id={`${uid}-tab-${m.id}`}
              role="tab"
              aria-selected={selected}
              aria-controls={`${uid}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectMode(m.id)}
              className={`min-h-11 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none ${
                selected ? "bg-ink text-paper shadow-sm" : "text-mid-gray"
              }`}
            >
              {m.label}
            </button>
          );
        })}
        <span className="sr-only" aria-live="polite">
          {MODES[activeIndex]?.label}
        </span>
      </div>

      <div id={`${uid}-panel`} role="tabpanel" aria-live="polite">
        {state.mode === "direct" ? (
          <div className="flex flex-col gap-5">
            <div>
              <FieldLabel
                htmlFor={linkInputId}
                aside={
                  <a
                    href="https://www.google.com/maps"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-hairline px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-alt focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
                  >
                    Cari di Google Maps
                  </a>
                }
              >
                Link review Google Maps <span aria-hidden="true">*</span>
              </FieldLabel>
              <input
                id={linkInputId}
                type="url"
                inputMode="url"
                autoComplete="off"
                placeholder="https://search.google.com/local/writereview?placeid=…"
                value={state.reviewLink}
                onChange={(e) => onChange({ reviewLink: e.target.value })}
                aria-describedby={`${uid}-link-hint`}
                aria-invalid={hasLink && !link.ok}
                className="w-full rounded-2xl border border-hairline bg-surface-alt px-4 py-3 font-mono text-sm text-ink placeholder:text-mid-gray focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none"
              />
              <p
                id={`${uid}-link-hint`}
                className={`mt-2 font-mono text-xs ${
                  !hasLink
                    ? "text-mid-gray"
                    : link.ok
                      ? "text-green-700"
                      : "text-ember"
                }`}
              >
                {!hasLink ? "Tempel link review Google atau TripAdvisor." : link.hint}
              </p>
            </div>

            <div>
              <FieldLabel
                htmlFor={nameInputId}
                aside={
                  <span
                    className="font-mono text-xs text-mid-gray"
                    aria-live="polite"
                  >
                    {state.businessName.length}/{BUSINESS_NAME_MAX} karakter
                  </span>
                }
              >
                Nama tempat usaha <span aria-hidden="true">*</span>
              </FieldLabel>
              <input
                id={nameInputId}
                type="text"
                autoComplete="off"
                maxLength={BUSINESS_NAME_MAX}
                placeholder="Nama usaha di kartu"
                value={state.businessName}
                onChange={(e) => onChange({ businessName: e.target.value })}
                className="w-full rounded-2xl border border-hairline bg-surface-alt px-4 py-3 text-sm text-ink placeholder:text-mid-gray focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-hairline bg-canvas p-4">
              <p className="font-mono text-xs font-semibold tracking-widest text-ink uppercase">
                Kartu kosong (aktivasi nanti)
              </p>
              <p className="mt-1 text-sm text-mid-gray">
                Cetak kartu dulu tanpa nama toko. Pembeli tinggal scan QR untuk
                pasang link tokonya sendiri.
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-paper p-4">
                <div>
                  <p className="font-mono text-xs text-mid-gray">ID KARTU:</p>
                  <p
                    className="font-mono text-xl font-semibold text-ink"
                    aria-live="polite"
                  >
                    {state.cardId}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ cardId: generateCardId() })}
                    className="min-h-11 rounded-full bg-ink px-4 text-sm font-semibold text-paper focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    ID Baru
                  </button>
                  <a
                    href={blankUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center rounded-full border border-hairline px-4 text-sm font-semibold text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
                  >
                    Buka Link
                  </a>
                </div>
              </div>
            </div>

            <div>
              <FieldLabel htmlFor={`${uid}-target`}>Link target QR</FieldLabel>
              <input
                id={`${uid}-target`}
                type="text"
                readOnly
                value={blankUrl}
                onFocus={(e) => e.target.select()}
                className="w-full rounded-2xl border border-hairline bg-surface-alt px-4 py-3 font-mono text-sm text-ink focus:border-ink focus:outline-none"
              />
              <p className="mt-2 font-mono text-xs text-mid-gray">
                Jika belum aktif mengarah ke halaman aktivasi. Jika sudah aktif
                langsung buka review Google.
              </p>
            </div>

            <div className="rounded-2xl border border-hairline bg-canvas p-4">
              <p className="font-mono text-xs font-semibold tracking-widest text-ink uppercase">
                Siap untuk stok jualan
              </p>
              <p className="mt-1 text-sm text-mid-gray">
                Kartu dicetak tanpa nama toko. Cocok untuk stok yang dijual ke
                berbagai tempat.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-hairline">
        <button
          type="button"
          aria-expanded={state.textsOpen}
          aria-controls={`${uid}-texts`}
          onClick={() => onChange({ textsOpen: !state.textsOpen })}
          className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-inset focus-visible:outline-none"
        >
          <span>
            Ubah Teks Kartu{" "}
            <span className="ml-2 rounded-full border border-hairline px-2 py-0.5 font-mono text-xs font-normal text-mid-gray">
              Judul, Badge, CTA
            </span>
          </span>
          <span
            aria-hidden="true"
            className={`text-mid-gray transition-transform ${state.textsOpen ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>
        {state.textsOpen && (
          <div
            id={`${uid}-texts`}
            className="grid gap-3 border-t border-hairline p-4 sm:grid-cols-2"
          >
            {(
              [
                ["title", "Judul"],
                ["badge", "Badge"],
                ["cta", "CTA"],
                ["subCta", "Sub-CTA"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label
                  htmlFor={`${uid}-text-${key}`}
                  className="mb-1 block font-mono text-xs text-mid-gray"
                >
                  {label}
                </label>
                <input
                  id={`${uid}-text-${key}`}
                  type="text"
                  value={state.texts[key]}
                  placeholder="Default cetak"
                  onChange={(e) =>
                    onChange({ texts: { ...state.texts, [key]: e.target.value } })
                  }
                  className="w-full rounded-xl border border-hairline bg-surface-alt px-3 py-2 text-sm text-ink placeholder:text-mid-gray focus:border-ink focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-hairline pt-4">
        <p className="mb-3 font-mono text-xs font-medium tracking-widest text-ink uppercase">
          Pengaturan tampilan
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Toggle
            label="5 Bintang"
            checked={state.showStars}
            onToggle={() => onChange({ showStars: !state.showStars })}
            icon={<span aria-hidden="true">★</span>}
          />
          <Toggle
            label="Ikon NFC"
            checked={state.showNfc}
            onToggle={() => onChange({ showNfc: !state.showNfc })}
            icon={<span aria-hidden="true">((·))</span>}
          />
          <Toggle
            label="Serial ID"
            checked={state.showSerial}
            onToggle={() => onChange({ showSerial: !state.showSerial })}
            icon={<span aria-hidden="true">#</span>}
          />
          <Toggle
            label="Bleed"
            checked={state.bleed}
            onToggle={() => onChange({ bleed: !state.bleed })}
            icon={<span aria-hidden="true">⛶</span>}
          />
        </div>
      </div>

      <div className="mt-5 border-t border-hairline pt-4">
        <p
          id={`${uid}-theme-label`}
          className="mb-3 font-mono text-xs font-medium tracking-widest text-ink uppercase"
        >
          Tema kartu
        </p>
        <div
          role="radiogroup"
          aria-labelledby={`${uid}-theme-label`}
          className="grid grid-cols-2 gap-1 rounded-full border border-hairline bg-canvas p-1"
        >
          {(
            [
              ["dark", "Dark"],
              ["google", "Google"],
            ] as const
          ).map(([id, label]) => {
            const checked = state.cardTheme === id;
            return (
              <label
                key={id}
                className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ink has-focus-visible:outline-none ${
                  checked ? "bg-ink text-paper shadow-sm" : "text-mid-gray"
                }`}
              >
                <input
                  type="radio"
                  name={`${uid}-card-theme`}
                  value={id}
                  checked={checked}
                  onChange={() => onChange({ cardTheme: id })}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                    checked ? "border-paper" : "border-hairline"
                  }`}
                >
                  {checked ? "●" : ""}
                </span>
                {label}
              </label>
            );
          })}
        </div>
      </div>
    </section>
  );
}
