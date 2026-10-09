/**
 * Client lookup in the Italian business register (Registro Imprese) through
 * openapi.com (company.openapi.com). Server-only.
 *
 * Two cheap steps: autocomplete while typing (IT-search with the "name"
 * enrichment, ~€0.001 a call) and one "start" call for the full card when a
 * company is picked (~€0.015). Results are cached in memory and the paid
 * calls are capped per day (COMPANY_LOOKUP_DAILY_LIMIT).
 * `COMPANY_LOOKUP=mock` serves canned companies for local development.
 */
import { companyEnv } from "./env";
import type { Party } from "./quote";
import { rateLimit } from "./ratelimit";

export type CompanyHit = {
  id: string;
  name: string;
  vat?: string;
  taxCode?: string;
  city?: string;
  province?: string;
  /** Full card when the search already carried it (VAT-number queries, mock) */
  party?: Party;
};

export type LookupFailure = "disabled" | "auth" | "credit" | "quota" | "rate_limited" | "upstream";
export type LookupResult<T> = { ok: true; data: T } | { ok: false; reason: LookupFailure; message?: string };

/** Shape of a company as company.openapi.com returns it (Name / Start schemas). */
export type RawCompany = {
  id?: string | null;
  companyName?: string | null;
  vatCode?: string | null;
  taxCode?: string | null;
  sdiCode?: string | null;
  activityStatus?: string | null;
  address?: {
    registeredOffice?: {
      toponym?: string | null;
      street?: string | null;
      streetNumber?: string | null;
      streetName?: string | null;
      town?: string | null;
      hamlet?: string | null;
      province?: string | null;
      zipCode?: string | null;
    } | null;
  } | null;
};

const clean = (v: unknown): string => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

const SMALL_WORDS = new Set(["di", "del", "dell", "dello", "della", "dei", "degli", "delle", "da", "dal", "dall", "de", "e", "ed", "in", "nel", "nell", "a", "al", "all", "alla", "ai", "sul", "sull", "sulla", "su", "per"]);

/** "VIALE F TOMMASO MARINETTI 221" → "Viale F Tommaso Marinetti 221"; keeps roman numerals and joining words. */
export function titleCase(s: string): string {
  let first = true;
  return s.toLowerCase().replace(/[\p{L}\p{N}]+/gu, (w) => {
    const isFirst = first;
    first = false;
    if (!isFirst && SMALL_WORDS.has(w)) return w;
    // ordinals up to 39 (Vittorio Emanuele II, XX Settembre, Giovanni XXIII); "di", "mi", "ci" are words, not numerals
    if (w.length > 1 && /^x{0,3}(ix|iv|v?i{0,3})$/.test(w)) return w.toUpperCase();
    return w.charAt(0).toUpperCase() + w.slice(1);
  });
}

/** Full card for the quote: official name as registered, address and town in title case. */
export function toParty(raw: RawCompany): Party | null {
  const name = clean(raw.companyName);
  if (!name) return null;
  const o = raw.address?.registeredOffice ?? {};
  const street = clean(o.streetName) || [o.toponym, o.street, o.streetNumber].map(clean).filter(Boolean).join(" ");
  const vat = clean(raw.vatCode);
  const taxCode = clean(raw.taxCode);
  const p: Party = { name };
  if (vat) p.vat = vat;
  if (taxCode && taxCode !== vat) p.taxCode = taxCode;
  if (street) p.address = titleCase(street);
  if (clean(o.zipCode)) p.zip = clean(o.zipCode);
  if (clean(o.town)) p.city = titleCase(clean(o.town));
  if (clean(o.province)) p.province = clean(o.province).toUpperCase();
  p.country = "Italia";
  if (clean(raw.sdiCode)) p.sdi = clean(raw.sdiCode).toUpperCase();
  return p;
}

/** One suggestion row from a search result. */
export function toHit(raw: RawCompany): CompanyHit | null {
  const name = clean(raw.companyName);
  const id = clean(raw.id);
  if (!name || !id) return null;
  const o = raw.address?.registeredOffice ?? {};
  const hit: CompanyHit = { id, name };
  if (clean(raw.vatCode)) hit.vat = clean(raw.vatCode);
  if (clean(raw.taxCode) && clean(raw.taxCode) !== hit.vat) hit.taxCode = clean(raw.taxCode);
  if (clean(o.town)) hit.city = titleCase(clean(o.town));
  if (clean(o.province)) hit.province = clean(o.province).toUpperCase();
  return hit;
}

function hitFromParty(party: Party, id: string): CompanyHit {
  return { id, name: party.name, vat: party.vat, taxCode: party.taxCode, city: party.city, province: party.province, party };
}

export function normalizeQuery(q: string): string {
  return clean(q).slice(0, 80);
}

export const isVatNumber = (q: string): boolean => /^\d{11}$/.test(q);

// ---- in-memory cache (per warm instance), bounded and with a TTL
type Entry = { at: number; value: unknown };
const g = globalThis as unknown as { __plCompanyCache?: Map<string, Entry> };
const cache: Map<string, Entry> = g.__plCompanyCache ?? new Map();
g.__plCompanyCache = cache;
const MAX_CACHE = 1500;

async function cached<T>(key: string, ttlMs: number, load: () => Promise<LookupResult<T>>): Promise<LookupResult<T>> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return { ok: true, data: hit.value as T };
  const r = await load();
  if (r.ok) {
    cache.set(key, { at: Date.now(), value: r.data });
    if (cache.size > MAX_CACHE) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
  }
  return r;
}

// ---- openapi.com
const base = () => (companyEnv.sandbox() ? "https://test.company.openapi.com" : "https://company.openapi.com");

type Envelope = { data?: unknown; success?: boolean; message?: string; error?: number | null };

async function callOpenapi(path: string): Promise<LookupResult<RawCompany[]>> {
  const token = companyEnv.token();
  if (!token) return { ok: false, reason: "disabled" };
  // every upstream call is paid: count it against the daily cap before sending it
  if (!rateLimit("company:upstream", companyEnv.dailyLimit(), 24 * 60 * 60 * 1000).ok) return { ok: false, reason: "quota" };
  let res: Response;
  try {
    res = await fetch(`${base()}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
  } catch (e) {
    return { ok: false, reason: "upstream", message: e instanceof Error ? e.message : String(e) };
  }
  if (res.status === 204 || res.status === 404) return { ok: true, data: [] };
  let body: Envelope = {};
  try {
    body = (await res.json()) as Envelope;
  } catch {
    /* non-JSON error page */
  }
  if (res.status === 401 || res.status === 403) return { ok: false, reason: "auth", message: body.message };
  if (res.status === 402) return { ok: false, reason: "credit", message: body.message };
  if (res.status === 429) return { ok: false, reason: "rate_limited", message: body.message };
  if (!res.ok || body.success === false) return { ok: false, reason: "upstream", message: body.message ?? `HTTP ${res.status}` };
  const data = Array.isArray(body.data) ? body.data : body.data ? [body.data] : [];
  return { ok: true, data: data as RawCompany[] };
}

// ---- mock provider for local development (COMPANY_LOOKUP=mock)
const MOCK: RawCompany[] = [
  { id: "mock-1", companyName: "TRATTORIA DA GINO S.R.L.", vatCode: "01234567890", taxCode: "01234567890", sdiCode: "M5UXCR1", address: { registeredOffice: { streetName: "VIA ROMA 12", town: "MILANO", province: "MI", zipCode: "20121" } } },
  { id: "mock-2", companyName: "STUDIO ROSSI & ASSOCIATI", vatCode: "09876543210", taxCode: "09876543210", sdiCode: "SUBM70N", address: { registeredOffice: { streetName: "CORSO VITTORIO EMANUELE II 45", town: "TORINO", province: "TO", zipCode: "10123" } } },
  { id: "mock-3", companyName: "ROSSI MARIO", vatCode: "11223344556", taxCode: "RSSMRA80A01H501U", address: { registeredOffice: { streetName: "PIAZZA DEL POPOLO 3", town: "ROMA", province: "RM", zipCode: "00187" } } },
  { id: "mock-4", companyName: "BAR CENTRALE DI BIANCHI LUCA", vatCode: "55667788990", taxCode: "BNCLCU85C15L219K", address: { registeredOffice: { streetName: "VIA GARIBALDI 8", town: "BOLOGNA", province: "BO", zipCode: "40124" } } },
  { id: "mock-5", companyName: "OFFICINE MECCANICHE VERDI S.P.A.", vatCode: "66778899001", taxCode: "66778899001", sdiCode: "XL13LG4", address: { registeredOffice: { streetName: "VIA DELL'INDUSTRIA 100", town: "BRESCIA", province: "BS", zipCode: "25100" } } },
];

function mockSearch(q: string): CompanyHit[] {
  const needle = q.toLowerCase();
  const out: CompanyHit[] = [];
  for (const c of MOCK) {
    if (!(c.companyName ?? "").toLowerCase().includes(needle) && c.vatCode !== q) continue;
    const hit = toHit(c);
    const party = toParty(c);
    if (hit && party) out.push({ ...hit, party });
  }
  return out;
}

function mockGet(idOrVat: string): Party | null {
  const c = MOCK.find((m) => m.id === idOrVat || m.vatCode === idOrVat);
  return c ? toParty(c) : null;
}

// ---- public API
export function lookupEnabled(): boolean {
  return companyEnv.enabled();
}

/** Suggestions for what the user typed: companies whose name starts with it, or the one with that VAT number. */
export async function searchCompanies(input: string): Promise<LookupResult<CompanyHit[]>> {
  const q = normalizeQuery(input);
  if (q.length < 3) return { ok: true, data: [] };
  if (companyEnv.mock()) return { ok: true, data: mockSearch(q) };
  if (isVatNumber(q)) {
    const r = await getCompany(q);
    if (!r.ok) return r;
    return { ok: true, data: r.data ? [hitFromParty(r.data, q)] : [] };
  }
  return cached(`s:${q.toLowerCase()}`, 10 * 60 * 1000, async () => {
    const r = await callOpenapi(`/IT-search?autocomplete=${encodeURIComponent(q)}&dataEnrichment=name&limit=8`);
    if (!r.ok) return r;
    return { ok: true, data: r.data.map(toHit).filter((h): h is CompanyHit => Boolean(h)) };
  });
}

/** Full card of a company by openapi id or by VAT number / tax code. */
export async function getCompany(idOrVat: string): Promise<LookupResult<Party | null>> {
  const key = clean(idOrVat);
  if (!/^[A-Za-z0-9-]{1,64}$/.test(key)) return { ok: true, data: null };
  if (companyEnv.mock()) return { ok: true, data: mockGet(key) };
  return cached(`c:${key}`, 60 * 60 * 1000, async () => {
    const r = await callOpenapi(`/IT-start/${encodeURIComponent(key)}`);
    if (!r.ok) return r;
    return { ok: true, data: r.data[0] ? toParty(r.data[0]) : null };
  });
}
