"use client";

import { useEffect, useState } from "react";
import { isGoogleReviewLink } from "@/lib/qr";
import { toWriteReviewUrl } from "@/lib/review-url";

export type RemoteStatus = "idle" | "checking" | "ok" | "fail";

interface CheckResult {
  link: string;
  ok: boolean;
}

// Status tujuan ulasan untuk satu nilai link: hasil cek disimpan per-link,
// status "checking" diturunkan saat belum ada hasil untuk link berjalan.
export function useResolvedStatus(url: string): RemoteStatus {
  const [result, setResult] = useState<CheckResult | null>(null);
  const link = url.trim();

  useEffect(() => {
    if (!link || toWriteReviewUrl(link) || !isGoogleReviewLink(link)) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      let ok = false;
      try {
        const res = await fetch("/api/review-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: link }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          reviewUrl?: string | null;
        };
        ok = res.ok && Boolean(data.ok) && Boolean(data.reviewUrl);
      } catch {
        ok = false;
      }
      if (!cancelled) setResult({ link, ok });
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [link]);

  if (!link || toWriteReviewUrl(link) || !isGoogleReviewLink(link)) return "idle";
  if (result && result.link === link) return result.ok ? "ok" : "fail";
  return "checking";
}
