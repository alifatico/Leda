import { labelsFor, type DocLabels } from "./labels";
import { paletteFor, type Palette } from "./palette";
import type { Quote, StyleId, Totals } from "./types";

/** Document typefaces: TTF files for the PDF in `src/lib/pdf/fonts`, Google Fonts for the preview in `src/lib/fonts.ts`. */
export type FontKey = "franklin" | "manrope" | "inter" | "playfair" | "lora" | "plexCondensed" | "spaceGrotesk";

/** Macro structure of the page: how the header, the margins and the colour are organised. */
export type LayoutId = "letterhead" | "hero" | "swiss" | "masthead" | "dense" | "sidebar";

/** Visual tokens shared by the PDF and its HTML twin. */
export type StyleTokens = {
  layout: LayoutId;
  /** Body family */
  font: FontKey;
  /** Family of the title, the sender name and the big amounts */
  display: FontKey;
  /** PDF body size in points */
  fontSize: number;
  /** Corner radius of cards, fills and the table header; 0 is square */
  radius: number;
  /** PDF page padding; the hero band, the stripe and the sidebar add their own space */
  margins: { x: number; top: number };
  tableHeader: "filled" | "rule" | "double";
  /** Tinted odd rows */
  zebra: boolean;
  /** "01", "02"… before each item */
  numbered: boolean;
  /** Tinted card behind the client block */
  clientCard: boolean;
  /** How the final amount is highlighted */
  payable: "filled" | "panel" | "outline" | "rule";
  /** The amount due repeated big in the header band or the sidebar */
  heroTotal: boolean;
  /** Initials badge in the brand colour when there is no logo */
  monogram: boolean;
};

export const STYLE_IDS = ["classico", "moderno", "essenziale", "elegante", "compatto", "studio"] as const satisfies readonly StyleId[];

export const STYLES: Record<StyleId, StyleTokens> = {
  classico: { layout: "letterhead", font: "franklin", display: "franklin", fontSize: 9.5, radius: 5, margins: { x: 44, top: 40 }, tableHeader: "filled", zebra: false, numbered: true, clientCard: true, payable: "filled", heroTotal: false, monogram: false },
  moderno: { layout: "hero", font: "manrope", display: "manrope", fontSize: 9.5, radius: 8, margins: { x: 44, top: 40 }, tableHeader: "rule", zebra: false, numbered: true, clientCard: true, payable: "panel", heroTotal: true, monogram: true },
  essenziale: { layout: "swiss", font: "inter", display: "inter", fontSize: 9.5, radius: 0, margins: { x: 50, top: 48 }, tableHeader: "rule", zebra: false, numbered: false, clientCard: false, payable: "rule", heroTotal: false, monogram: false },
  elegante: { layout: "masthead", font: "lora", display: "playfair", fontSize: 10, radius: 0, margins: { x: 56, top: 46 }, tableHeader: "double", zebra: false, numbered: false, clientCard: false, payable: "outline", heroTotal: false, monogram: false },
  compatto: { layout: "dense", font: "plexCondensed", display: "plexCondensed", fontSize: 8.5, radius: 0, margins: { x: 36, top: 30 }, tableHeader: "filled", zebra: true, numbered: false, clientCard: true, payable: "filled", heroTotal: false, monogram: false },
  studio: { layout: "sidebar", font: "spaceGrotesk", display: "spaceGrotesk", fontSize: 9.5, radius: 6, margins: { x: 36, top: 44 }, tableHeader: "rule", zebra: false, numbered: true, clientCard: false, payable: "panel", heroTotal: true, monogram: true },
};

/** Fixed colour column of the "sidebar" layout, in points. */
export const SIDEBAR_WIDTH = 140;
/** Full-bleed band of the "hero" layout, in points. */
export const HERO_HEIGHT = 158;
/** Colour stripe on the left edge of the "dense" layout, in points. */
export const STRIPE_WIDTH = 7;

export type ResolvedDesign = {
  style: StyleId;
  tokens: StyleTokens;
  /** Colours derived from the brand colour */
  palette: Palette;
  columns: { qty: boolean; unitPrice: boolean; vat: boolean };
  /** Default labels for the document language, with the user's overrides applied */
  labels: DocLabels;
  intro: string;
  closing: string;
  cover: { title: string; subtitle: string; image?: string } | null;
  showSignature: boolean;
  showValidity: boolean;
};

const clean = (v: string | undefined) => (v ?? "").trim();

/** Fill in every default so renderers never deal with optional fields. */
export function resolveDesign(quote: Quote): ResolvedDesign {
  const d = quote.design ?? {};
  const style: StyleId = d.style && d.style in STYLES ? d.style : "classico";
  const base = labelsFor(quote.lang);
  const o = d.labels ?? {};
  const labels: DocLabels = {
    ...base,
    quote: clean(o.title) || base.quote,
    from: clean(o.from) || base.from,
    to: clean(o.to) || base.to,
    subject: clean(o.subject) || base.subject,
    notes: clean(o.notes) || base.notes,
    paymentTerms: clean(o.paymentTerms) || base.paymentTerms,
    acceptance: clean(o.acceptance) || base.acceptance,
    signature: clean(o.signature) || base.signature,
    total: clean(o.total) || base.total,
    netPayable: clean(o.netPayable) || base.netPayable,
  };
  return {
    style,
    tokens: STYLES[style],
    palette: paletteFor(quote.branding?.color),
    columns: { qty: d.columns?.qty ?? true, unitPrice: d.columns?.unitPrice ?? true, vat: d.columns?.vat ?? true },
    labels,
    intro: clean(d.intro),
    closing: clean(d.closing),
    cover: d.cover?.enabled ? { title: clean(d.cover.title), subtitle: clean(d.cover.subtitle), image: d.cover.image } : null,
    showSignature: d.showSignature ?? true,
    showValidity: d.showValidity ?? true,
  };
}

/** Up to two initials for the monogram badge: "Studio Rossi Design" gives "SR". */
export function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter((w) => /\p{L}/u.test(w));
  return words
    .slice(0, 2)
    .map((w) => [...w].find((c) => /\p{L}/u.test(c)) ?? "")
    .join("")
    .toUpperCase();
}

/** The one number the client looks for: what they pay after withholding, else the total. */
export function headlineAmount(t: Totals, L: DocLabels): { label: string; value: number } {
  return t.ritenuta > 0 ? { label: L.netPayable, value: t.netPayable } : { label: L.total, value: t.total };
}

/** "01", "02"… for the numbered item lists. */
export function itemIndex(i: number): string {
  return String(i + 1).padStart(2, "0");
}
