/* localStorage persistence. Everything the user creates lives only in their browser. */
import { cleanParty, normalizeName, type SavedClient } from "./clients";
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

const KEYS = { quotes: "pl.quotes.v1", profile: "pl.profile.v1", license: "pl.license.v1", templates: "pl.templates.v1", clients: "pl.clients.v1" } as const;

const MAX_CLIENTS = 300;

/** A quote saved as a reusable starting point: look, texts, items and options, never the client. */
export type SavedTemplate = {
  id: string;
  name: string;
  createdAt: number;
  data: Pick<Quote, "lang" | "currency" | "validityDays" | "subject" | "items" | "notes" | "paymentTerms" | "options" | "branding" | "design">;
};

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

export const templatesStore = {
  all(): SavedTemplate[] {
    const list = read<SavedTemplate[]>(KEYS.templates) ?? [];
    return list.filter((t) => t && t.id && t.data).sort((a, b) => b.createdAt - a.createdAt);
  },
  save(tpl: SavedTemplate): void {
    const list = this.all().filter((t) => t.id !== tpl.id);
    list.unshift(tpl);
    write(KEYS.templates, list.slice(0, 50));
  },
  remove(id: string): void {
    write(
      KEYS.templates,
      this.all().filter((t) => t.id !== id),
    );
  },
};

/**
 * Address book of the clients used so far: one entry per quote, kept even after
 * the quote is deleted. `dedupeClients()` (src/lib/clients.ts) turns it into the
 * list shown while typing a client name.
 */
export const clientsStore = {
  entries(): SavedClient[] {
    const list = read<SavedClient[]>(KEYS.clients) ?? [];
    return list.filter((e) => e && e.quoteId && e.party && typeof e.party.name === "string");
  },
  /** Called on autosave: the entry for this quote always mirrors its current client. */
  remember(quoteId: string, party: Party, updatedAt: number = Date.now()): void {
    const all = this.entries();
    const rest = all.filter((e) => e.quoteId !== quoteId);
    if (!party.name.trim()) {
      // name cleared: no half-empty card for this quote
      if (rest.length !== all.length) write(KEYS.clients, rest);
      return;
    }
    write(KEYS.clients, [{ quoteId, party: cleanParty(party), updatedAt }, ...rest].slice(0, MAX_CLIENTS));
  },
  /** Import the clients of quotes written before the address book existed. */
  seedFromQuotes(quotes: StoredQuote[]): void {
    const have = new Set(this.entries().map((e) => e.quoteId));
    const missing = quotes.filter((s) => !have.has(s.quote.id) && typeof s.quote.client?.name === "string" && s.quote.client.name.trim());
    if (!missing.length) return;
    const added = missing.map((s) => ({ quoteId: s.quote.id, party: cleanParty(s.quote.client), updatedAt: s.quote.updatedAt }));
    write(
      KEYS.clients,
      [...added, ...this.entries()].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CLIENTS),
    );
  },
  /** Drop every version of a client, whatever quote it came from. */
  forget(name: string): void {
    const key = normalizeName(name);
    write(
      KEYS.clients,
      this.entries().filter((e) => normalizeName(e.party.name) !== key),
    );
  },
};

export function templateFromQuote(q: Quote, name: string): SavedTemplate {
  return {
    id: newId(),
    name,
    createdAt: Date.now(),
    data: {
      lang: q.lang,
      currency: q.currency,
      validityDays: q.validityDays,
      subject: q.subject,
      items: q.items.map((i) => ({ ...i })),
      notes: q.notes,
      paymentTerms: q.paymentTerms,
      options: { ...q.options },
      branding: { ...q.branding },
      design: q.design ? { ...q.design } : undefined,
    },
  };
}

/** New quote from a saved template, with fresh ids and number and the profile's sender. */
export function createQuoteFromSaved(tpl: SavedTemplate): Quote {
  const base = createQuoteFromProfile();
  const d = tpl.data;
  return {
    ...base,
    lang: d.lang,
    currency: d.currency,
    validityDays: d.validityDays,
    subject: d.subject ?? "",
    items: d.items.length ? d.items.map((i) => ({ ...i, id: newId() })) : base.items,
    notes: d.notes ?? "",
    paymentTerms: d.paymentTerms ?? "",
    options: { ...d.options },
    branding: { ...d.branding },
    design: d.design ? { ...d.design } : undefined,
  };
}

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
