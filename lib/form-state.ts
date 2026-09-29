// Bentuk state form kartu review. Satu objek ini yang dibaca preview (#6)
// dan export (#7). Lihat PRD.md S4, reference/input-QR*.png.
import type { CardThemeId } from "./card-themes";
import { generateCardId } from "./qr";

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
  };
}

// Payload QR terdebounce: verbatim link vs pola /r/G-XXXX (ADR-0003).
// appUrl diisi saat export, default origin browser.
export function qrPayloadOf(
  state: CardFormState,
  appUrl: string = "",
): string {
  if (state.mode === "blank") {
    const base = appUrl.replace(/\/+$/, "");
    return `${base}/r/${state.cardId.trim()}`;
  }
  return state.reviewLink.trim();
}
