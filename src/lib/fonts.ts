import { IBM_Plex_Sans_Condensed, Inter, Libre_Franklin, Lora, Manrope, Playfair_Display, Space_Grotesk } from "next/font/google";
import type { FontKey } from "@/lib/quote/styles";

/** The app's own UI font; also the body of the "essenziale" document style. */
export const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });

const franklin = Libre_Franklin({ subsets: ["latin", "latin-ext"], display: "swap" });
const manrope = Manrope({ subsets: ["latin", "latin-ext"], display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin", "latin-ext"], style: ["normal", "italic"], display: "swap" });
const lora = Lora({ subsets: ["latin", "latin-ext"], style: ["normal", "italic"], display: "swap" });
const plexCondensed = IBM_Plex_Sans_Condensed({ subsets: ["latin", "latin-ext"], weight: ["400", "600"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin", "latin-ext"], display: "swap" });

/**
 * CSS font stacks of the document typefaces for the HTML preview. The PDF
 * embeds the same families from `src/lib/pdf/fonts`.
 */
export const DOC_FONT_FAMILY: Record<FontKey, string> = {
  franklin: franklin.style.fontFamily,
  manrope: manrope.style.fontFamily,
  inter: inter.style.fontFamily,
  playfair: playfair.style.fontFamily,
  lora: lora.style.fontFamily,
  plexCondensed: plexCondensed.style.fontFamily,
  spaceGrotesk: spaceGrotesk.style.fontFamily,
};
