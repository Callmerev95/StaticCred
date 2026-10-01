// Daftar kartu /cards (client): statistik, filter, salin link aktivasi.
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deleteCardAction } from "@/lib/actions";
import { formatCardDate } from "@/lib/cards-format";
import type { ListedCard } from "@/lib/store";
import {
  BTN_SECONDARY,
  BTN_SMALL,
  ERROR_BOX,
  LABEL_CAPTION,
  LABEL_EYEBROW,
} from "@/lib/ui-classes";
import QrOverlay from "./QrOverlay";

type Filter = "all" | "active" | "pending";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-hairline bg-paper p-5 shadow-sm">
      <p className={LABEL_EYEBROW}>
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={BTN_SMALL}
    >
      {copied ? "Tersalin" : "Salin Link"}
    </button>
  );
}

function CardRow({
  card,
  base,
  onDeleted,
}: {
  card: ListedCard;
  base: string;
  onDeleted: (id: string) => void;
}) {
  const active = card.status === "active";
  const [qrOpen, setQrOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await deleteCardAction(card.id, pin);
      if (result.ok) {
        onDeleted(card.id);
      } else {
        setError(result.error ?? "Gagal menghapus.");
      }
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <li className="rounded-3xl border border-hairline bg-paper p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-sm font-semibold">{card.id}</p>
        <p
          className={`rounded-full border px-3 py-1 font-mono text-xs ${
            active
              ? "border-hairline bg-surface-alt text-ink"
              : "border-hairline text-mid-gray"
          }`}
        >
          {active ? "AKTIF" : "BELUM AKTIF"}
        </p>
      </div>
      {card.batch && (
        <p className="mt-2 font-mono text-xs text-mid-gray">{card.batch}</p>
      )}
      <h2 className="mt-2 text-xl font-semibold tracking-tight break-words">
        {active ? card.nama : "(Belum diaktifkan)"}
      </h2>
      {active && card.url ? (
        <p className="mt-2 text-sm break-all">
          <span className="text-mid-gray">Ulasan: </span>
          <a
            href={card.url}
            target="_blank"
            rel="noreferrer"
            className="text-ink underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            {card.url}
          </a>
        </p>
      ) : (
        <p className="mt-2 text-sm break-all">
          <span className="text-mid-gray">Link aktivasi: </span>
          <span className="font-mono text-xs">{`${base}/r/${card.id}/activate`}</span>
        </p>
      )}
      <p className="mt-3 font-mono text-xs text-mid-gray">
        {card.scan} scan · Dibuat: {formatCardDate(card.createdAt)}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className={BTN_SMALL}
        >
          Lihat QR
        </button>
        {qrOpen && (
          <QrOverlay
            card={card}
            payload={`${base}/r/${card.id}`}
            onClose={() => setQrOpen(false)}
          />
        )}
        {active ? (
          <>
            <a
              href={`/r/${card.id}`}
              target="_blank"
              rel="noreferrer"
              className={BTN_SMALL}
            >
              Tes Link
            </a>
            <Link href={`/r/${card.id}/manage`} className={BTN_SMALL}>
              Kelola
            </Link>
          </>
        ) : (
          <>
            <Link href={`/r/${card.id}/activate`} className={BTN_SMALL}>
              Aktivasi
            </Link>
            <CopyButton text={`${base}/r/${card.id}/activate`} />
          </>
        )}
        <button
          type="button"
          onClick={() => {
            setConfirming((v) => !v);
            setError(null);
            setPin("");
          }}
          aria-expanded={confirming}
          className="inline-flex min-h-9 items-center rounded-full border border-ember/40 px-3 text-xs font-semibold text-ember transition-colors hover:bg-ember/5 focus-visible:ring-2 focus-visible:ring-ember focus-visible:outline-none"
        >
          Hapus
        </button>
      </div>
      {confirming && (
        <div className="mt-4 rounded-2xl border border-ember/40 bg-ember/5 p-4">
          <p className="text-sm font-semibold text-ink">
            Hapus permanen {card.id}?
          </p>
          <p className={`mt-1 text-xs text-deep-gray`}>
            Kartu hilang dari database dan tak bisa dikembalikan. Kartu fisik
            yang sudah tercetak ikut mati.
          </p>
          <label
            htmlFor={`hapus-pin-${card.id}`}
            className={`mt-3 block ${LABEL_CAPTION}`}
          >
            Ketik PIN admin untuk setuju
          </label>
          <input
            id={`hapus-pin-${card.id}`}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN admin"
            className="mt-1 w-full rounded-2xl border border-hairline bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-mid-gray focus:border-ink focus:outline-none"
          />
          {error && (
            <p role="alert" className={ERROR_BOX}>
              {error}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmDelete}
              disabled={busy || pin.trim().length === 0}
              className="inline-flex min-h-9 items-center rounded-full bg-ember px-4 text-xs font-semibold text-paper focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Menghapus..." : "Hapus permanen"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setError(null);
                setPin("");
              }}
              className={BTN_SMALL}
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function CardsList({
  cards,
  base,
}: {
  cards: ListedCard[];
  base: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [removed, setRemoved] = useState<string[]>([]);
  const router = useRouter();
  const live = cards.filter((c) => !removed.includes(c.id));
  const counts = useMemo(
    () => ({
      all: live.length,
      active: live.filter((c) => c.status === "active").length,
      pending: live.filter((c) => c.status !== "active").length,
    }),
    [live],
  );
  const totalScan = useMemo(
    () => live.reduce((sum, c) => sum + c.scan, 0),
    [live],
  );
  const shown = live.filter((c) =>
    filter === "all" ? true : c.status === filter,
  );
  const tabs: Array<{ id: Filter; label: string }> = [
    { id: "all", label: `Semua (${counts.all})` },
    { id: "active", label: `Aktif (${counts.active})` },
    { id: "pending", label: `Pending (${counts.pending})` },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-5 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={LABEL_EYEBROW}>
            Area pemilik
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Daftar Kartu QR
          </h1>
          <p className="mt-2 text-sm text-deep-gray">
            Daftar kartu Google Review yang sudah dibuat.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className={BTN_SECONDARY}
          >
            Kembali
          </button>
          <Link href="/" className={BTN_SECONDARY}>
            Buat Kartu Baru
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total Kartu" value={counts.all} />
        <Stat label="Kartu Aktif" value={counts.active} />
        <Stat label="Pending" value={counts.pending} />
        <Stat label="Total Scan" value={totalScan} />
      </div>

      <div
        role="tablist"
        aria-label="Filter kartu"
        className="flex flex-wrap gap-2"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={filter === t.id}
            onClick={() => setFilter(t.id)}
            className={`inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none ${
              filter === t.id
                ? "border-ink bg-ink text-paper"
                : "border-hairline text-deep-gray hover:bg-surface-alt"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <section className="rounded-3xl border border-hairline bg-paper p-8 text-center shadow-sm">
          <p className="font-semibold">
            {filter === "all"
              ? "Belum ada kartu"
              : filter === "active"
                ? "Belum ada kartu aktif"
                : "Tidak ada kartu pending"}
          </p>
          <p className="mt-2 text-sm text-deep-gray">
            {filter === "all"
              ? "Buat kartu baru untuk melihatnya di sini."
              : "Ubah filter untuk melihat kartu lain."}
          </p>
        </section>
      ) : (
        <ul className="flex flex-col gap-4">
          {shown.map((card) => (
            <CardRow
              key={card.id}
              card={card}
              base={base}
              onDeleted={(id) => setRemoved((r) => [...r, id])}
            />
          ))}
        </ul>
      )}
      <p className="text-center font-mono text-xs text-mid-gray">
        StaticCred · data langsung dari database
      </p>
    </main>
  );
}
