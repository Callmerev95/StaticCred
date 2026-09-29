"use client";

import { useMemo, useState } from "react";
import BusinessForm from "@/components/BusinessForm";
import LivePreview from "@/components/LivePreview";
import {
  defaultCardFormState,
  QR_DEBOUNCE_MS,
  qrPayloadOf,
  type CardFormState,
} from "@/lib/form-state";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { SizeId } from "@/lib/sizes";

export default function Home() {
  const [form, setForm] = useState<CardFormState>(defaultCardFormState);
  const [sizeId, setSizeId] = useState<SizeId>("pvc-h");
  const patch = (p: Partial<CardFormState>) =>
    setForm((s) => ({ ...s, ...p }));

  const appUrl =
    typeof window === "undefined" ? "" : window.location.origin;
  const livePayload = useMemo(() => qrPayloadOf(form, appUrl), [form, appUrl]);
  const qrPayload = useDebouncedValue(livePayload, QR_DEBOUNCE_MS);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
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
      <div className="grid items-start gap-6 lg:grid-cols-[400px_1fr]">
        <BusinessForm state={form} onChange={patch} appUrl={appUrl} />
        <div className="lg:sticky lg:top-6">
          <LivePreview
            form={form}
            qrPayload={qrPayload}
            sizeId={sizeId}
            onSizeChange={setSizeId}
            onReset={() => setForm(defaultCardFormState())}
          />
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {qrPayload ? "QR siap dirender." : "Tempel link untuk membuat QR."}
      </p>
    </main>
  );
}
