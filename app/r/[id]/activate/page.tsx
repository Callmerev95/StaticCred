import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ActivationForm from "@/components/activation/ActivationForm";
import { ActivationSuccess, UnavailableView } from "@/components/activation/views";
import { kvAvailable } from "@/lib/kv";
import { isValidCardId } from "@/lib/qr";
import { getActiveCard } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aktivasi Kartu Review",
  robots: { index: false },
};

async function resolveSerial(raw: string): Promise<string> {
  if (isValidCardId(raw)) return raw;
  const upper = raw.toUpperCase();
  if (upper !== raw && isValidCardId(upper)) {
    redirect(`/r/${upper}/activate`);
  }
  notFound();
}

export default async function ActivateRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const serial = await resolveSerial(id);

  if (!kvAvailable()) return <UnavailableView serial={serial} />;

  const card = await getActiveCard(serial);
  if (card) return <ActivationSuccess serial={serial} nama={card.nama} url={card.url} />;

  return <ActivationForm serial={serial} />;
}
