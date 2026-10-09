import { labelsFor, type DocLabels } from "./labels";
import type { Quote, StyleId } from "./types";

/** Visual tokens shared by the PDF and its HTML twin. */
export type StyleTokens = {
  font: "helvetica" | "times" | "courier";
  /** split: name left, title right (default); band: coloured header band; centered: title centred over a rule */
  header: "split" | "band" | "centered";
  tableHeader: "filled" | "underline";
  /** grey box behind the client block */
  partyBox: boolean;
  totalsHighlight: "filled" | "outline";
  /** PDF base font size in points */
  fontSize: number;
  rounded: boolean;
};

export const STYLE_IDS = ["classico", "moderno", "essenziale", "elegante", "compatto"] as const satisfies readonly StyleId[];

export const STYLES: Record<StyleId, StyleTokens> = {
  classico: { font: "helvetica", header: "split", tableHeader: "filled", partyBox: true, totalsHighlight: "filled", fontSize: 9.5, rounded: true },
  moderno: { font: "helvetica", header: "band", tableHeader: "filled", partyBox: false, totalsHighlight: "filled", fontSize: 9.5, rounded: true },
  essenziale: { font: "helvetica", header: "split", tableHeader: "underline", partyBox: false, totalsHighlight: "outline", fontSize: 9.5, rounded: false },
  elegante: { font: "times", header: "centered", tableHeader: "underline", partyBox: false, totalsHighlight: "outline", fontSize: 10, rounded: false },
  compatto: { font: "helvetica", header: "split", tableHeader: "filled", partyBox: true, totalsHighlight: "filled", fontSize: 8.5, rounded: false },
};

export type ResolvedDesign = {
  style: StyleId;
  tokens: StyleTokens;
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
    columns: { qty: d.columns?.qty ?? true, unitPrice: d.columns?.unitPrice ?? true, vat: d.columns?.vat ?? true },
    labels,
    intro: clean(d.intro),
    closing: clean(d.closing),
    cover: d.cover?.enabled ? { title: clean(d.cover.title), subtitle: clean(d.cover.subtitle), image: d.cover.image } : null,
    showSignature: d.showSignature ?? true,
    showValidity: d.showValidity ?? true,
  };
}
