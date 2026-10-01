import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { kvGet, kvSet } from "./kv";
import { resolveReviewUrl } from "./resolve-review";

vi.mock("./kv", () => ({
  kvGet: vi.fn(),
  kvSet: vi.fn(),
}));

const kvGetMock = vi.mocked(kvGet);
const kvSetMock = vi.mocked(kvSet);
const fetchMock = vi.fn();

const PLACE_ID = "ChIJ149LSEexzS0RYOTs2W8-6NY";
const CANONICAL = `https://search.google.com/local/writereview?placeid=${PLACE_ID}`;
const MAPS_FID =
  "https://www.google.com/maps/place/Kopi/data=!1s0x47b18f1cae867bab:0xb6f8b3a3753ba1a2!8m2";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  kvGetMock.mockReset().mockResolvedValue(null);
  kvSetMock.mockReset().mockResolvedValue(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("resolveReviewUrl", () => {
  it("link sudah mengandung place ID: tanpa jaringan", async () => {
    const result = await resolveReviewUrl(`https://search.google.com/local/writereview?placeid=${PLACE_ID}`);
    expect(result).toBe(CANONICAL);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("link Maps ber-fid: resolve + tulis cache", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ review_url: CANONICAL }));
    const result = await resolveReviewUrl(MAPS_FID);
    expect(result).toBe(CANONICAL);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [endpoint, init] = fetchMock.mock.calls[0];
    expect(String(endpoint)).toContain("google-review-link");
    expect(String((init as RequestInit).body)).toContain("maps_url");
    expect(kvSetMock).toHaveBeenCalledTimes(1);
  });

  it("cache hit: tanpa jaringan", async () => {
    kvGetMock.mockResolvedValue(CANONICAL);
    const result = await resolveReviewUrl(MAPS_FID);
    expect(result).toBe(CANONICAL);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("balasan tidak berupa writereview Google: null", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ review_url: "https://evil.example/x" }));
    expect(await resolveReviewUrl(MAPS_FID)).toBeNull();
  });

  it("resolver non-200: null", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false, 422));
    expect(await resolveReviewUrl(MAPS_FID)).toBeNull();
  });

  it("jaringan error: null tanpa lempar", async () => {
    fetchMock.mockRejectedValue(new Error("timeout"));
    expect(await resolveReviewUrl(MAPS_FID)).toBeNull();
  });

  it("bukan link Google: null tanpa jaringan", async () => {
    expect(await resolveReviewUrl("https://www.tripadvisor.com/Review-x")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("input kosong: null tanpa jaringan", async () => {
    expect(await resolveReviewUrl("")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
