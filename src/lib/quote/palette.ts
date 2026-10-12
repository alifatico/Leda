/**
 * Colours derived from the brand colour, so the whole document feels themed
 * rather than painted: light tints for cards and zebra rows, a shade dark
 * enough to read as text on white, white or ink on top of the accent.
 */
export type Palette = {
  /** The brand colour as given */
  accent: string;
  /** Text drawn on an accent fill */
  onAccent: string;
  /** The accent, darkened until it reads as text on white */
  deep: string;
  /** Very light accent background: cards, zebra rows, panels */
  tint: string;
  /** Accent-tinted line for rules and borders */
  line: string;
  /** Body text */
  ink: string;
  /** Labels and secondary text */
  muted: string;
  /** Footer and tertiary text */
  faint: string;
  /** Neutral hairlines */
  rule: string;
};

export const DEFAULT_ACCENT = "#1E3A8A";
const HEX = /^#[0-9a-fA-F]{6}$/;
const WHITE = "#FFFFFF";
const INK = "#16181D";

/** The colour when it is a 6-digit hex, the default accent otherwise. */
export function safeHex(color: string | undefined): string {
  return color && HEX.test(color) ? color.toUpperCase() : DEFAULT_ACCENT;
}

type Rgb = [number, number, number];
const toRgb = (hex: string): Rgb => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const toHex = (rgb: Rgb) =>
  "#" +
  rgb
    .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

/** Blend `a` towards `b` by `t` (0 gives `a`, 1 gives `b`), in sRGB: good enough for tints. */
export function mix(a: string, b: string, t: number): string {
  const A = toRgb(a);
  const B = toRgb(b);
  return toHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours, 1 to 21. */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function paletteFor(color: string | undefined): Palette {
  const accent = safeHex(color);
  let deep = accent;
  for (let i = 0; i < 12 && contrast(deep, WHITE) < 4.5; i++) deep = mix(deep, "#000000", 0.12);
  return {
    accent,
    onAccent: contrast(accent, WHITE) >= 3 ? WHITE : INK,
    deep,
    tint: mix(accent, WHITE, 0.92),
    line: mix(accent, WHITE, 0.6),
    ink: INK,
    muted: "#5B6472",
    faint: "#9AA1AB",
    rule: "#E4E7EB",
  };
}
