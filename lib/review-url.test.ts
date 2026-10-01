import { describe, expect, it } from "vitest";
import { extractPlaceId, toWriteReviewUrl } from "./review-url";

const PLACE_ID = "ChIJ149LSEexzS0RYOTs2W8-6NY";

describe("extractPlaceId", () => {
  it("mengambil place ID dari URL pola place_id:", () => {
    expect(
      extractPlaceId(`https://www.google.com/maps/place/?q=place_id:${PLACE_ID}`),
    ).toBe(PLACE_ID);
  });

  it("mengambil place ID dari query placeid=", () => {
    expect(
      extractPlaceId(`https://search.google.com/local/writereview?placeid=${PLACE_ID}`),
    ).toBe(PLACE_ID);
  });

  it("mengambil place ID dari token ChIJ bebas di URL Google", () => {
    expect(
      extractPlaceId(`https://www.google.com/maps/place/X/data=!1s${PLACE_ID}!2e0`),
    ).toBe(PLACE_ID);
  });

  it("tolak link tanpa place ID", () => {
    expect(extractPlaceId("https://g.page/r/abc/review")).toBeNull();
    expect(
      extractPlaceId(
        "https://www.google.com/maps/place/Kopi/@-6.2,106.8,17z/data=!4m2!3d1!4d2",
      ),
    ).toBeNull();
  });

  it("tolak URL bukan Google meski mengandung token serupa", () => {
    expect(extractPlaceId(`https://contoh.com/?id=${PLACE_ID}`)).toBeNull();
  });

  it("tolak input rusak atau kosong", () => {
    expect(extractPlaceId("")).toBeNull();
    expect(extractPlaceId("bukan url")).toBeNull();
  });
});

describe("toWriteReviewUrl", () => {
  it("membentuk URL tulis ulasan Google Search", () => {
    expect(
      toWriteReviewUrl(`https://www.google.com/maps/place/?q=place_id:${PLACE_ID}`),
    ).toBe(`https://search.google.com/local/writereview?placeid=${PLACE_ID}`);
  });

  it("idempoten untuk link yang sudah benar", () => {
    const canonical = `https://search.google.com/local/writereview?placeid=${PLACE_ID}`;
    expect(toWriteReviewUrl(canonical)).toBe(canonical);
  });

  it("null saat tidak bisa direwrite (dipakai link apa adanya)", () => {
    expect(toWriteReviewUrl("https://maps.app.goo.gl/xyz")).toBeNull();
    expect(toWriteReviewUrl("https://www.tripadvisor.com/Review-x")).toBeNull();
    expect(toWriteReviewUrl("")).toBeNull();
  });
});
