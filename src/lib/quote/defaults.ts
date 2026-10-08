import type { Branding, LineItem, Party, Quote, QuoteOptions } from "./types";

export const DEFAULT_VAT_RATE = 22;
export const DEFAULT_VALIDITY_DAYS = 30;
export const DEFAULT_CURRENCY = "EUR";
export const DEFAULT_COLOR = "#1E3A8A";

export const BOLLO_AMOUNT = 2.0;
export const BOLLO_THRESHOLD = 77.47;

export const SUPPORTED_CURRENCIES = ["EUR", "USD", "GBP", "CHF"] as const;

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyParty(): Party {
  return { name: "" };
}

export function defaultOptions(): QuoteOptions {
  return {
    globalDiscountPct: 0,
    rivalsaInpsPct: 0,
    ritenutaAccontoPct: 0,
    regimeForfettario: false,
    bollo: true,
    depositPct: 0,
  };
}

export function defaultBranding(): Branding {
  return { color: DEFAULT_COLOR };
}

export function newLineItem(partial: Partial<LineItem> = {}): LineItem {
  return {
    id: partial.id ?? newId(),
    description: "",
    quantity: 1,
    unit: "",
    unitPrice: 0,
    vatRate: DEFAULT_VAT_RATE,
    discountPct: 0,
    ...partial,
  };
}

export function todayIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function nextQuoteNumber(existing: string[], date: Date = new Date()): string {
  const year = date.getFullYear();
  const prefix = `PRV-${year}-`;
  let max = 0;
  for (const n of existing) {
    if (n.startsWith(prefix)) {
      const seq = parseInt(n.slice(prefix.length), 10);
      if (!Number.isNaN(seq) && seq > max) max = seq;
    }
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

export function newQuote(partial: Partial<Quote> = {}): Quote {
  // Only touch the clock / RNG for the fields the caller did not provide, so a
  // fully specified quote (e.g. the sample) is deterministic and prerenderable.
  const now = partial.createdAt ?? partial.updatedAt ?? Date.now();
  return {
    id: partial.id ?? newId(),
    version: 1,
    number: "PRV-0001",
    date: partial.date ?? todayIso(),
    validityDays: DEFAULT_VALIDITY_DAYS,
    currency: DEFAULT_CURRENCY,
    lang: "it",
    subject: "",
    sender: emptyParty(),
    client: emptyParty(),
    items: partial.items ?? [newLineItem()],
    notes: "",
    paymentTerms: "",
    options: defaultOptions(),
    branding: defaultBranding(),
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}
