import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteCardAction } from "./actions";
import { issueCardsSession } from "./cards-auth";

let cookieValue: string | undefined;

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({
    get: (name: string) =>
      name === "cards_admin" && cookieValue !== undefined
        ? { value: cookieValue }
        : undefined,
  }),
}));

function setEnv() {
  process.env.KV_REST_API_URL = "https://example.upstash.io";
  process.env.KV_REST_API_TOKEN = "token";
  process.env.ADMIN_PIN = "246810";
}

function mockDel(results: Array<number | null>) {
  globalThis.fetch = (async () => Response.json(results.map((r) => ({ result: r })))) as unknown as typeof fetch;
}

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
  cookieValue = undefined;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.ADMIN_PIN;
  vi.restoreAllMocks();
});

describe("deleteCardAction", () => {
  it("menolak serial invalid", async () => {
    setEnv();
    cookieValue = issueCardsSession();
    expect(await deleteCardAction("salah", "246810")).toEqual({
      ok: false,
      error: "Serial kartu tidak dikenal.",
    });
  });

  it("menolak tanpa sesi pemilik", async () => {
    setEnv();
    expect(await deleteCardAction("G-ABCDEF", "246810")).toEqual({
      ok: false,
      error: "Sesi pemilik kedaluwarsa. Masukkan PIN di halaman daftar dulu.",
    });
  });

  it("menolak PIN admin salah", async () => {
    setEnv();
    cookieValue = issueCardsSession();
    expect(await deleteCardAction("G-ABCDEF", "000000")).toEqual({
      ok: false,
      error: "PIN admin salah.",
    });
  });

  it("unavailable tanpa KV walau sesi + PIN benar", async () => {
    process.env.ADMIN_PIN = "246810";
    cookieValue = issueCardsSession();
    mockDel([1, 1, 1, 1, 1]);
    expect(await deleteCardAction("G-ABCDEF", "246810")).toEqual({
      ok: false,
      error: "Layanan aktivasi belum terkonfigurasi di server ini.",
    });
  });

  it("kartu tak ada → 0 dengan pesan jujur", async () => {
    setEnv();
    cookieValue = issueCardsSession();
    mockDel([0, 0, 0, 0, 0]);
    expect(await deleteCardAction("G-ABCDEF", "246810")).toEqual({
      ok: false,
      error: "Kartu tidak ditemukan (mungkin sudah terhapus).",
    });
  });

  it("sukses menghapus dan lapor jumlah key", async () => {
    setEnv();
    cookieValue = issueCardsSession();
    mockDel([1, 1, 1, 0, 0]);
    expect(await deleteCardAction("G-ABCDEF", "246810")).toEqual({
      ok: true,
      deleted: 3,
    });
  });
});
