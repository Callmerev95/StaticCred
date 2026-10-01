// Halaman /cards: daftar kartu + statistik, di balik gerbang PIN admin.
// ADR-0006. Tanpa KV atau tanpa ADMIN_PIN tampil kondisi jujur, bukan daftar.

import type { Metadata } from "next";
import Link from "next/link";
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

// Database gagal dibaca (mis. respons KV tak terduga): tampil jujur,
// bukan halaman crash digest.
function CardsErrorView() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <section className="rounded-3xl border border-hairline bg-paper p-6 shadow-sm">
        <p className="font-mono text-xs font-semibold tracking-widest text-mid-gray uppercase">
          Database gagal dibaca
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Daftar kartu tak termuat</h1>
        <p className="mt-3 text-sm leading-relaxed text-deep-gray">
          Server tidak bisa membaca database kartu. Tunggu sebentar lalu muat
          ulang; bila berlanjut, periksa env KV di server.
        </p>
        <Link
          href="/cards"
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-paper focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Muat ulang
        </Link>
      </section>
    </main>
  );
}

export default async function CardsPage() {
  const jar = await cookies();
  const authed = verifyCardsSession(jar.get(CARDS_COOKIE)?.value);
  if (!authed) return <PinGate unconfigured={!cardsAuthConfigured()} />;
  if (!kvAvailable()) return <UnavailableView />;
  let cards: Awaited<ReturnType<typeof listCards>>;
  try {
    cards = await listCards();
  } catch {
    return <CardsErrorView />;
  }
  if (!cards) return <UnavailableView />;
  return <CardsList cards={cards} base={await absoluteBase()} />;
}
