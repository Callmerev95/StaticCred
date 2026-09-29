"use client";

import { useMemo, useState } from "react";
import BusinessForm from "@/components/BusinessForm";
import {
  defaultCardFormState,
  QR_DEBOUNCE_MS,
  qrPayloadOf,
  type CardFormState,
} from "@/lib/form-state";
import { useDebouncedValue } from "@/lib/use-debounced-value";

export default function Home() {
  const [form, setForm] = useState<CardFormState>(defaultCardFormState);
  const patch = (p: Partial<CardFormState>) =>
    setForm((s) => ({ ...s, ...p }));

  const appUrl =
    typeof window === "undefined" ? "" : window.location.origin;
  const livePayload = useMemo(() => qrPayloadOf(form, appUrl), [form, appUrl]);
  const qrPayload = useDebouncedValue(livePayload, QR_DEBOUNCE_MS);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <p className="w-fit rounded-full border border-hairline bg-paper px-3 py-1 font-mono text-xs text-mid-gray">
          Zero backend · 300 DPI · Canvas native
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          StaticCred Review Card Printer
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-mid-gray">
          Paste link review Google / TripAdvisor, atur kartu di live preview,
          lalu download PNG atau PDF siap cetak.
        </p>
      </div>
      <BusinessForm state={form} onChange={patch} appUrl={appUrl} />
      <p className="sr-only" aria-live="polite">
        {qrPayload ? "QR siap dirender." : "Tempel link untuk membuat QR."}
      </p>
    </main>
  );
}
