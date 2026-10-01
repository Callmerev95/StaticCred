"use client";

import { useEffect, useMemo, useState } from "react";
import BusinessForm from "@/components/BusinessForm";
import LivePreview from "@/components/LivePreview";
import LogoQrForm from "@/components/LogoQrForm";
import {
  defaultCardFormState,
  QR_DEBOUNCE_MS,
  qrPayloadOf,
  type CardFormState,
} from "@/lib/form-state";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { appBaseUrl } from "@/lib/app-url";
import { isGoogleReviewLink } from "@/lib/qr";
import { toWriteReviewUrl } from "@/lib/review-url";
import type { SizeId } from "@/lib/sizes";

export default function Home() {
  const [form, setForm] = useState<CardFormState>(defaultCardFormState);
  const [sizeId, setSizeId] = useState<SizeId>("pvc-h");
  const [resolved, setResolved] = useState<{ link: string; url: string } | null>(
    null,
  );
  const patch = (p: Partial<CardFormState>) =>
    setForm((s) => ({ ...s, ...p }));

  const { reviewLink, mode } = form;
  const directLink = mode === "direct" ? reviewLink.trim() : "";
  const needsResolve =
    Boolean(directLink) &&
    !toWriteReviewUrl(directLink) &&
    isGoogleReviewLink(directLink);
  const resolvedLink =
    needsResolve && resolved && resolved.link === directLink ? resolved.url : "";
  const resolving = needsResolve && !(resolved && resolved.link === directLink);

  useEffect(() => {
    if (!needsResolve) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      let out = "";
      try {
        const res = await fetch("/api/review-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: directLink }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          reviewUrl?: string | null;
        };
        if (res.ok && data.ok && data.reviewUrl) out = data.reviewUrl;
      } catch {
        // Resolver gagal: payload tetap link apa adanya.
      }
      if (!cancelled) setResolved({ link: directLink, url: out });
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [needsResolve, directLink]);

  const appUrl = appBaseUrl();
  const livePayload = useMemo(
    () => qrPayloadOf(form, appUrl, resolvedLink),
    [form, appUrl, resolvedLink],
  );
  const qrPayload = useDebouncedValue(livePayload, QR_DEBOUNCE_MS);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <p className="w-fit rounded-full border border-hairline bg-paper px-3 py-1 font-mono text-xs text-mid-gray">
          Canvas native · 300 DPI · Cetak lokal
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          StaticCred Review Card Printer
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-deep-gray">
          Paste link review Google / TripAdvisor, atur kartu di live preview,
          lalu download PNG atau PDF siap cetak.
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[400px_1fr]">
        <div className="flex flex-col gap-6">
          <BusinessForm
            state={form}
            onChange={patch}
            appUrl={appUrl}
            resolvedLink={resolvedLink}
            resolving={resolving}
          />
          <LogoQrForm state={form} onChange={patch} />
        </div>
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
