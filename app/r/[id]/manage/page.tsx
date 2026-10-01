import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ManagePanel from "@/components/activation/ManagePanel";
import { UnavailableView } from "@/components/activation/views";
import { kvAvailable } from "@/lib/kv";
import { isValidCardId } from "@/lib/qr";
import { getActiveCard, getScanCount } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kelola Kartu",
  robots: { index: false },
};

async function resolveSerial(raw: string): Promise<string> {
  if (isValidCardId(raw)) return raw;
  const upper = raw.toUpperCase();
  if (upper !== raw && isValidCardId(upper)) {
    redirect(`/r/${upper}/manage`);
  }
  notFound();
}

export default async function ManageRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const serial = await resolveSerial(id);

  if (!kvAvailable()) return <UnavailableView serial={serial} />;

  const card = await getActiveCard(serial);
  if (!card) redirect(`/r/${serial}/activate?isNew=true`);

  const scan = await getScanCount(serial);

  return <ManagePanel serial={serial} initialScan={scan} />;
}
