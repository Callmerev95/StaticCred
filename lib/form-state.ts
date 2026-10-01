// Bentuk state form kartu review. Satu objek ini yang dibaca preview (#6)
// dan export (#7). Lihat PRD.md S4.
import type { CardThemeId } from "./card-themes";
import { blankCardUrl, generateCardId } from "./qr";
import { toWriteReviewUrl } from "./review-url";

export type FormMode = "direct" | "blank";

export interface CardTextOverrides {
  title: string;
  badge: string;
  cta: string;
  subCta: string;
}

export interface CardFormState {
  mode: FormMode;
  reviewLink: string;
  businessName: string;
  cardId: string;
  cardTheme: CardThemeId;
  showStars: boolean;
  showNfc: boolean;
  showSerial: boolean;
  bleed: boolean;
  texts: CardTextOverrides;
  textsOpen: boolean;
  logoDataUrl: string;
}

// Debounce payload QR agar preview tidak render full-res tiap keystroke (ADR-0002).
export const QR_DEBOUNCE_MS = 250;
export const BUSINESS_NAME_MAX = 60;

export function defaultCardFormState(): CardFormState {
  return {
    mode: "direct",
    reviewLink: "",
    businessName: "",
    cardId: generateCardId(),
    cardTheme: "dark",
    showStars: true,
    showNfc: true,
    showSerial: false,
    bleed: false,
    texts: { title: "", badge: "", cta: "", subCta: "" },
    textsOpen: false,
    logoDataUrl: "",
  };
}

// Payload QR terdebounce: verbatim link vs pola /r/G-XXXXXX (ADR-0005).
// appUrl diisi saat export, default origin browser.
// resolvedLink: hasil auto-generate tujuan tulis ulasan (server, terdebounce).
export function qrPayloadOf(
  state: CardFormState,
  appUrl: string = "",
  resolvedLink: string = "",
): string {
  if (state.mode === "blank") {
    const id = state.cardId.trim();
    return id ? blankCardUrl(appUrl, id) : "";
  }
  const link = state.reviewLink.trim();
  return toWriteReviewUrl(link) || resolvedLink.trim() || link;
}
