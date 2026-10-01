// Halaman /cards: daftar kartu + statistik, di balik gerbang PIN admin.
// ADR-0006. Tanpa KV atau tanpa ADMIN_PIN tampil kondisi jujur, bukan daftar.

import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import CardsList from "@/components/cards/CardsList";
import PinGate from "@/components/cards/PinGate";
import { UnavailableView } from "@/components/activation/views";
import {
  CARDS_COOKIE,
  cardsAuthConfigured,
  verifyCardsSession,
} from "@/lib/cards-auth";
import { kvAvailable } from "@/lib/kv";
import { listCards } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Daftar Kartu",
  robots: { index: false },
};

async function absoluteBase(): Promise<string> {
  const h = await headers();
  const proto =
    h.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const host =
    h.get("x-forwarded-host")?.split(",")[0]?.trim() || h.get("host") || "";
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return host ? `${proto}://${host}` : "";
}

export default async function CardsPage() {
  const jar = await cookies();
  const authed = verifyCardsSession(jar.get(CARDS_COOKIE)?.value);
  if (!authed) return <PinGate unconfigured={!cardsAuthConfigured()} />;
  if (!kvAvailable()) return <UnavailableView />;
  const cards = await listCards();
  if (!cards) return <UnavailableView />;
  return <CardsList cards={cards} base={await absoluteBase()} />;
}
