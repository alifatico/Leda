/**
 * The built-in PDF fonts (Helvetica) only cover WinAnsi. Anything outside it
 * (emoji, CJK, maths symbols) would render as a blank box, so we map what we
 * can and drop the rest before drawing.
 */
const EXTRA_OK = new Set(
  "ŒœŠšŽžŸƒˆ˜•–—‘’‚“”„†‡…‰‹›€™".split("").map((c) => c.codePointAt(0) as number),
);

const REPLACEMENTS: Record<string, string> = {
  " ": " ",
  "‑": "-",
  "‒": "-",
  "–": "–",
  "―": "—",
  "′": "'",
  "″": '"',
  "−": "-",
  "→": "->",
  "←": "<-",
  "✓": "v",
  "✔": "v",
  "•": "•",
  "●": "•",
  "­": "",
};

export function sanitizeForPdf(input: string | undefined | null): string {
  if (!input) return "";
  let out = "";
  for (const ch of input.normalize("NFC")) {
    const cp = ch.codePointAt(0) as number;
    if (cp === 0x0a || cp === 0x09) {
      out += ch;
      continue;
    }
    if (cp < 0x20) continue;
    if (cp <= 0xff || EXTRA_OK.has(cp)) {
      out += ch;
      continue;
    }
    if (ch in REPLACEMENTS) {
      out += REPLACEMENTS[ch];
      continue;
    }
    // Strip combining marks / unsupported symbols silently
  }
  return out;
}
