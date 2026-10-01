import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { kvAvailable } from "@/lib/kv";
import { isValidCardId } from "@/lib/qr";
import { getActiveCard, recordScan } from "@/lib/store";
import { toWriteReviewUrl } from "@/lib/review-url";
import { Interstitial, UnavailableView } from "@/components/activation/views";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kartu Review",
  robots: { index: false },
};

async function resolveSerial(raw: string): Promise<string> {
  if (isValidCardId(raw)) return raw;
  const upper = raw.toUpperCase();
  if (upper !== raw && isValidCardId(upper)) {
    redirect(`/r/${upper}`);
  }
  notFound();
}

export default async function CardRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const serial = await resolveSerial(id);

  if (!kvAvailable()) return <UnavailableView serial={serial} />;

  const card = await getActiveCard(serial);
  if (!card) redirect(`/r/${serial}/activate?isNew=true`);

  await recordScan(serial);

  const target = toWriteReviewUrl(card.url) ?? card.url;
  return <Interstitial serial={serial} nama={card.nama} url={target} />;
}
