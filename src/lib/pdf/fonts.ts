import fs from "node:fs";
import path from "node:path";
import { Font } from "@react-pdf/renderer";
import type { FontKey } from "@/lib/quote";

/**
 * Document typefaces for the PDF: static TTF instances (Open Font License)
 * in this folder, registered with react-pdf on first use. The HTML preview
 * loads the same families from Google Fonts (`src/lib/fonts.ts`).
 */
type Face = { file: string; fontWeight: 400 | 500 | 600 | 700; fontStyle?: "italic" };

const FACES: Record<FontKey, { family: string; faces: Face[]; fallback: "Helvetica" | "Times-Roman" }> = {
  franklin: {
    family: "Libre Franklin",
    faces: [
      { file: "LibreFranklin-400.ttf", fontWeight: 400 },
      { file: "LibreFranklin-600.ttf", fontWeight: 600 },
      { file: "LibreFranklin-700.ttf", fontWeight: 700 },
    ],
    fallback: "Helvetica",
  },
  manrope: {
    family: "Manrope",
    faces: [
      { file: "Manrope-400.ttf", fontWeight: 400 },
      { file: "Manrope-500.ttf", fontWeight: 500 },
      { file: "Manrope-700.ttf", fontWeight: 700 },
    ],
    fallback: "Helvetica",
  },
  inter: {
    family: "Inter",
    faces: [
      { file: "Inter-400.ttf", fontWeight: 400 },
      { file: "Inter-600.ttf", fontWeight: 600 },
    ],
    fallback: "Helvetica",
  },
  playfair: {
    family: "Playfair Display",
    faces: [
      { file: "PlayfairDisplay-600.ttf", fontWeight: 600 },
      { file: "PlayfairDisplay-400italic.ttf", fontWeight: 400, fontStyle: "italic" },
    ],
    fallback: "Times-Roman",
  },
  lora: {
    family: "Lora",
    faces: [
      { file: "Lora-400.ttf", fontWeight: 400 },
      { file: "Lora-600.ttf", fontWeight: 600 },
      { file: "Lora-400italic.ttf", fontWeight: 400, fontStyle: "italic" },
    ],
    fallback: "Times-Roman",
  },
  plexCondensed: {
    family: "IBM Plex Sans Condensed",
    faces: [
      { file: "IBMPlexSansCondensed-400.ttf", fontWeight: 400 },
      { file: "IBMPlexSansCondensed-600.ttf", fontWeight: 600 },
    ],
    fallback: "Helvetica",
  },
  spaceGrotesk: {
    family: "Space Grotesk",
    faces: [
      { file: "SpaceGrotesk-400.ttf", fontWeight: 400 },
      { file: "SpaceGrotesk-700.ttf", fontWeight: 700 },
    ],
    fallback: "Helvetica",
  },
};

const FONT_DIR = path.join(process.cwd(), "src", "lib", "pdf", "fonts");
const registered = new Map<FontKey, string>();

/**
 * The react-pdf family name to use for a document font. Registers the TTF
 * files once per process; when they are not on disk (a serverless bundle
 * that did not trace them) the built-in Helvetica or Times stands in, so a
 * PDF is always produced.
 */
export function pdfFamily(key: FontKey): string {
  const done = registered.get(key);
  if (done) return done;
  const def = FACES[key];
  const files = def.faces.map((f) => path.join(FONT_DIR, f.file));
  let family = def.fallback as string;
  if (files.every((f) => fs.existsSync(f))) {
    Font.register({
      family: def.family,
      fonts: def.faces.map((f, i) => ({ src: files[i], fontWeight: f.fontWeight, fontStyle: f.fontStyle ?? "normal" })),
    });
    family = def.family;
  } else {
    console.warn(`[pdf] font files for "${key}" not found in ${FONT_DIR}; using ${def.fallback}`);
  }
  registered.set(key, family);
  return family;
}
