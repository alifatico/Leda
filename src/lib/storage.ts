/* localStorage persistence. Everything the user creates lives only in their browser. */
import { newId, nextQuoteNumber, newQuote, type Party, type Quote, type QuoteOptions, type Branding, type DocLang } from "./quote";
import { getProfession, templateItems } from "./professions";

export type ShareInfo = {
  id: string;
  ownerKey: string;
  url: string;
  status?: "sent" | "viewed" | "accepted" | "declined";
  decisionName?: string;
  updatedAt: number;
};

export type StoredQuote = {
  quote: Quote;
  /** signed single-purchase unlock token */
  unlock?: string;
  unlockedAt?: number;
  /** public link sent to the client, if any */
  share?: ShareInfo;
};

export type Profile = {
  sender: Party;
  defaults: {
    lang: DocLang;
    currency: string;
    vatRate: number;
    validityDays: number;
    options: QuoteOptions;
    branding: Branding;
    paymentTerms: string;
    notes: string;
  };
};

export type StoredLicense = { token: string; exp: number; plan: "monthly" | "yearly"; email?: string | null };

const KEYS = { quotes: "pl.quotes.v1", profile: "pl.profile.v1", license: "pl.license.v1" } as const;

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const quotesStore = {
  all(): StoredQuote[] {
    const list = read<StoredQuote[]>(KEYS.quotes) ?? [];
    return list.filter((s) => s && s.quote && s.quote.id).sort((a, b) => b.quote.updatedAt - a.quote.updatedAt);
  },
  get(id: string): StoredQuote | null {
    return this.all().find((s) => s.quote.id === id) ?? null;
  },
  save(entry: StoredQuote): void {
    const list = this.all().filter((s) => s.quote.id !== entry.quote.id);
    list.unshift(entry);
    // keep the list bounded; logos can be heavy
    write(KEYS.quotes, list.slice(0, 200));
  },
  remove(id: string): void {
    write(
      KEYS.quotes,
      this.all().filter((s) => s.quote.id !== id),
    );
  },
  setUnlock(id: string, unlock: string): StoredQuote | null {
    const entry = this.get(id);
    if (!entry) return null;
    const updated = { ...entry, unlock, unlockedAt: Date.now() };
    this.save(updated);
    return updated;
  },
  numbers(): string[] {
    return this.all().map((s) => s.quote.number);
  },
};

export const profileStore = {
  get(): Profile | null {
    return read<Profile>(KEYS.profile);
  },
  save(p: Profile): void {
    write(KEYS.profile, p);
  },
  updateFromQuote(q: Quote): void {
    const current = this.get();
    const next: Profile = {
      sender: q.sender,
      defaults: {
        lang: q.lang,
        currency: q.currency,
        vatRate: current?.defaults.vatRate ?? 22,
        validityDays: q.validityDays,
        options: q.options,
        branding: q.branding,
        paymentTerms: q.paymentTerms ?? "",
        notes: current?.defaults.notes ?? "",
      },
    };
    this.save(next);
  },
};

export const licenseStore = {
  get(): StoredLicense | null {
    return read<StoredLicense>(KEYS.license);
  },
  save(l: StoredLicense): void {
    write(KEYS.license, l);
  },
  clear(): void {
    if (typeof window !== "undefined") window.localStorage.removeItem(KEYS.license);
  },
};

/** New quote pre-filled from the saved profile and numbered after the existing ones. */
export function createQuoteFromProfile(): Quote {
  const p = profileStore.get();
  const base = newQuote();
  const number = nextQuoteNumber(quotesStore.numbers());
  if (!p) return { ...base, number };
  return {
    ...base,
    number,
    lang: p.defaults.lang,
    currency: p.defaults.currency,
    validityDays: p.defaults.validityDays,
    sender: p.sender,
    options: { ...p.defaults.options },
    branding: { ...p.defaults.branding },
    paymentTerms: p.defaults.paymentTerms,
    items: base.items.map((i) => ({ ...i, vatRate: p.defaults.options.regimeForfettario ? 0 : p.defaults.vatRate })),
  };
}

/** Decode the payload half of a licence token in the browser (no verification, display only). */
export function peekLicense(token: string): { exp?: number; plan?: "monthly" | "yearly"; email?: string; kind?: string } | null {
  try {
    const body = token.split(".")[0];
    const json = atob(body.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** New quote from a profession template (/app?template=slug), merged with the saved profile. */
export function createQuoteFromTemplate(slug: string): Quote | null {
  const p = getProfession(slug);
  if (!p) return null;
  const base = createQuoteFromProfile();
  const forfettario = base.options.regimeForfettario;
  return {
    ...base,
    lang: "it",
    subject: p.subject,
    items: templateItems(p).map((i) => ({ ...i, id: newId(), vatRate: forfettario ? 0 : i.vatRate })),
    notes: p.notes,
    paymentTerms: p.paymentTerms,
    options: { ...base.options, ...(p.options ?? {}), regimeForfettario: forfettario, ritenutaAccontoPct: forfettario ? 0 : (p.options?.ritenutaAccontoPct ?? base.options.ritenutaAccontoPct) },
  };
}
