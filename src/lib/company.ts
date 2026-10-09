/**
 * Client lookup in the Italian business register (Registro Imprese). Server-only.
 *
 * Two providers behind one interface (see `companyEnv` in env.ts):
 * - openapi.com: real-time API. Autocomplete while typing (IT-search with the
 *   "name" enrichment, ~€0.001 a call) and one "start" call for the full card
 *   when a company is picked (~€0.015).
 * - Apify actor: a scraper that runs for some seconds. The search starts a run
 *   and returns its id; the browser polls `pollRun()` until the records are
 *   in. Each record is paid, so every hit already carries the full card.
 * Results are cached in memory and the paid calls are capped per day
 * (COMPANY_LOOKUP_DAILY_LIMIT). `COMPANY_LOOKUP=mock` serves canned companies.
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
  /** Full card when the search already carried it (VAT-number queries, Apify records, mock) */
  party?: Party;
};

/** What a search returns: the hits, or the id of a run still in progress to poll. */
export type SearchOutcome = { hits: CompanyHit[] } | { runId: string };
export type RunOutcome = { running: true } | { hits: CompanyHit[] };

export type LookupFailure = "disabled" | "auth" | "credit" | "quota" | "rate_limited" | "upstream";
export type LookupResult<T> = { ok: true; data: T } | { ok: false; reason: LookupFailure; message?: string };

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

export function normalizeQuery(q: string): string {
  return clean(q).slice(0, 80);
}

export const isVatNumber = (q: string): boolean => /^\d{11}$/.test(q);

// ---------------------------------------------------------------- openapi.com

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

// ---------------------------------------------------------------- Apify actor

/** One record of the jungle_synthesizer/italy-registroimprese-bilanci-scraper dataset (the fields used here). */
export type ApifyRecord = {
  vat_number?: string | null;
  tax_code?: string | null;
  rea_number?: string | null;
  legal_name?: string | null;
  status?: string | null;
  registered_address?: string | null;
  pec_email?: string | null;
  phone?: string | null;
  website?: string | null;
  codice_destinatario?: string | null;
};

/** "VIA CADUTI DI SABBIUNO 3 - 40068 - SAN LAZZARO DI SAVENA (BO)" → street, ZIP, town, province. */
export function parseItalianAddress(s: string): Pick<Party, "address" | "zip" | "city" | "province"> {
  const text = clean(s);
  if (!text) return {};
  const m = /^(.*?)[\s,-]*\b(\d{5})\b[\s,-]*(.*?)\s*$/.exec(text);
  if (!m) return { address: titleCase(text) };
  const out: Pick<Party, "address" | "zip" | "city" | "province"> = { zip: m[2] };
  const street = m[1].replace(/[\s,-]+$/, "");
  if (street) out.address = titleCase(street);
  let town = m[3].replace(/[\s,-]+$/, "");
  const paren = /^(.*?)\s*\(([A-Za-z]{2})\)$/.exec(town);
  if (paren) {
    town = paren[1];
    out.province = paren[2].toUpperCase();
  } else {
    const tail = /^(.*\S)\s+([A-Z]{2})$/.exec(town);
    if (tail) {
      town = tail[1];
      out.province = tail[2];
    }
  }
  if (town) out.city = titleCase(town);
  return out;
}

/** Full card from an Apify record; null for companies struck off the register. */
export function apifyToParty(rec: ApifyRecord): Party | null {
  const name = clean(rec.legal_name);
  if (!name) return null;
  if (/^(CESSATA|CANCELLATA)/i.test(clean(rec.status))) return null;
  const vat = clean(rec.vat_number).replace(/^IT/i, "");
  const taxCode = clean(rec.tax_code);
  const p: Party = { name };
  if (vat) p.vat = vat;
  if (taxCode && taxCode !== vat) p.taxCode = taxCode;
  Object.assign(p, parseItalianAddress(clean(rec.registered_address)));
  p.country = "Italia";
  if (clean(rec.phone)) p.phone = clean(rec.phone);
  if (clean(rec.pec_email)) p.pec = clean(rec.pec_email).toLowerCase();
  if (clean(rec.website)) p.website = clean(rec.website);
  if (/^[A-Za-z0-9]{6,7}$/.test(clean(rec.codice_destinatario))) p.sdi = clean(rec.codice_destinatario).toUpperCase();
  return p;
}

export function apifyToHit(rec: ApifyRecord): CompanyHit | null {
  const party = apifyToParty(rec);
  if (!party) return null;
  const id = party.vat || party.taxCode || clean(rec.rea_number).replace(/[^A-Za-z0-9]/g, "") || `n-${party.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 40)}`;
  return hitFromParty(party, id);
}

// ------------------------------------------------- in-memory cache (per warm instance)
type Entry = { at: number; value: unknown };
const g = globalThis as unknown as { __plCompanyCache?: Map<string, Entry> };
const cache: Map<string, Entry> = g.__plCompanyCache ?? new Map();
g.__plCompanyCache = cache;
const MAX_CACHE = 1500;
const MIN = 60 * 1000;

function remember(key: string, value: unknown): void {
  cache.set(key, { at: Date.now(), value });
  if (cache.size > MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

function recall<T>(key: string, ttlMs: number): T | undefined {
  const hit = cache.get(key);
  return hit && Date.now() - hit.at < ttlMs ? (hit.value as T) : undefined;
}

async function cached<T>(key: string, ttlMs: number, load: () => Promise<LookupResult<T>>): Promise<LookupResult<T>> {
  const hit = recall<T>(key, ttlMs);
  if (hit !== undefined) return { ok: true, data: hit };
  const r = await load();
  if (r.ok) remember(key, r.data);
  return r;
}

/** Every upstream call is paid: count it against the daily cap before sending it. */
function withinDailyCap(): boolean {
  return rateLimit("company:upstream", companyEnv.dailyLimit(), 24 * 60 * MIN).ok;
}

/** Keep the cards of the hits so that /api/company/:id can serve them without another paid call. */
function rememberCards(hits: CompanyHit[]): void {
  for (const h of hits) if (h.party) remember(`c:${h.id}`, h.party);
}

// ---------------------------------------------------------------- HTTP helpers
type Envelope = { data?: unknown; success?: boolean; message?: string; error?: unknown };

function failureFor(status: number, message?: string): LookupResult<never> {
  if (status === 401 || status === 403) return { ok: false, reason: "auth", message };
  if (status === 402) return { ok: false, reason: "credit", message };
  if (status === 429) return { ok: false, reason: "rate_limited", message };
  return { ok: false, reason: "upstream", message: message ?? `HTTP ${status}` };
}

const openapiBase = () => (companyEnv.openapi.sandbox() ? "https://test.company.openapi.com" : "https://company.openapi.com");

async function callOpenapi(path: string): Promise<LookupResult<RawCompany[]>> {
  const token = companyEnv.openapi.token();
  if (!token) return { ok: false, reason: "disabled" };
  if (!withinDailyCap()) return { ok: false, reason: "quota" };
  let res: Response;
  try {
    res = await fetch(`${openapiBase()}${path}`, {
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
  if (!res.ok || body.success === false) return failureFor(res.status, body.message);
  const data = Array.isArray(body.data) ? body.data : body.data ? [body.data] : [];
  return { ok: true, data: data as RawCompany[] };
}

const APIFY = "https://api.apify.com/v2";

async function callApify(path: string, body?: unknown): Promise<LookupResult<unknown>> {
  const token = companyEnv.apify.token();
  if (!token) return { ok: false, reason: "disabled" };
  let res: Response;
  try {
    res = await fetch(`${APIFY}${path}`, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
  } catch (e) {
    return { ok: false, reason: "upstream", message: e instanceof Error ? e.message : String(e) };
  }
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const err = (json as { error?: { message?: string } } | null)?.error;
    return failureFor(res.status, err?.message);
  }
  return { ok: true, data: json };
}

type ApifyRun = { id?: string; status?: string; defaultDatasetId?: string };

/** Start a run of the register scraper for this query. */
async function apifyStart(q: string): Promise<LookupResult<string>> {
  if (!withinDailyCap()) return { ok: false, reason: "quota" };
  const input = { mode: isVatNumber(q) ? "by_vat_number" : "by_name", query: q, includePec: true, maxItems: companyEnv.apify.maxItems() };
  const r = await callApify(`/acts/${companyEnv.apify.actor()}/runs?timeout=${companyEnv.apify.timeoutSecs()}`, input);
  if (!r.ok) return r;
  const run = (r.data as { data?: ApifyRun } | null)?.data;
  if (!run?.id) return { ok: false, reason: "upstream", message: "run not started" };
  return { ok: true, data: run.id };
}

/** Run status and, once finished, the records. `waitForFinish` keeps the request open a few seconds. */
async function apifyPoll(runId: string): Promise<LookupResult<RunOutcome>> {
  const r = await callApify(`/actor-runs/${encodeURIComponent(runId)}?waitForFinish=5`);
  if (!r.ok) return r;
  const run = (r.data as { data?: ApifyRun } | null)?.data;
  const status = run?.status ?? "";
  if (status === "SUCCEEDED") {
    if (!run?.defaultDatasetId) return { ok: true, data: { hits: [] } };
    const items = await callApify(`/datasets/${encodeURIComponent(run.defaultDatasetId)}/items?clean=true&format=json`);
    if (!items.ok) return items;
    const records = Array.isArray(items.data) ? (items.data as ApifyRecord[]) : [];
    return { ok: true, data: { hits: records.map(apifyToHit).filter((h): h is CompanyHit => Boolean(h)) } };
  }
  if (["FAILED", "TIMED-OUT", "ABORTED", "TIMING-OUT", "ABORTING"].includes(status)) return { ok: false, reason: "upstream", message: `run ${status.toLowerCase()}` };
  return { ok: true, data: { running: true } };
}

// ---------------------------------------------------------------- mock provider
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

/** In on-demand mode the mock behaves like a run: the first poll says "running", the second brings the records. */
const mockPolls = new Map<string, number>();

// ---------------------------------------------------------------- public API
export function lookupEnabled(): boolean {
  return companyEnv.enabled();
}

/**
 * Suggestions for what the user typed: companies whose name starts with it, or
 * the one with that VAT number. With the Apify provider the answer is a run id
 * to poll, unless the same query was answered recently.
 */
export async function searchCompanies(input: string): Promise<LookupResult<SearchOutcome>> {
  const q = normalizeQuery(input);
  if (q.length < 3) return { ok: true, data: { hits: [] } };
  const provider = companyEnv.provider();
  if (!provider) return { ok: false, reason: "disabled" };
  const key = `s:${provider}:${q.toLowerCase()}`;

  if (provider === "mock") {
    if (companyEnv.mode() === "on-demand") {
      const runId = `mock-run-${encodeURIComponent(q.toLowerCase())}`;
      mockPolls.set(runId, 0);
      return { ok: true, data: { runId } };
    }
    return { ok: true, data: { hits: mockSearch(q) } };
  }

  if (provider === "apify") {
    const done = recall<CompanyHit[]>(key, 24 * 60 * MIN);
    if (done) return { ok: true, data: { hits: done } };
    const running = recall<string>(`r:${q.toLowerCase()}`, 5 * MIN);
    if (running) return { ok: true, data: { runId: running } };
    const started = await apifyStart(q);
    if (!started.ok) return started;
    remember(`r:${q.toLowerCase()}`, started.data);
    return { ok: true, data: { runId: started.data } };
  }

  if (isVatNumber(q)) {
    const r = await getCompany(q);
    if (!r.ok) return r;
    return { ok: true, data: { hits: r.data ? [hitFromParty(r.data, q)] : [] } };
  }
  return cached(key, 10 * MIN, async () => {
    const r = await callOpenapi(`/IT-search?autocomplete=${encodeURIComponent(q)}&dataEnrichment=name&limit=8`);
    if (!r.ok) return r;
    return { ok: true, data: { hits: r.data.map(toHit).filter((h): h is CompanyHit => Boolean(h)) } };
  });
}

/** Progress of a run started by `searchCompanies()`; `q` lets the finished records be cached for the next identical search. */
export async function pollRun(runId: string, q: string): Promise<LookupResult<RunOutcome>> {
  const provider = companyEnv.provider();
  if (!provider) return { ok: false, reason: "disabled" };
  const query = normalizeQuery(q);
  if (provider === "mock") {
    const n = mockPolls.get(runId);
    if (n === undefined) return { ok: false, reason: "upstream", message: "unknown run" };
    mockPolls.set(runId, n + 1);
    return n === 0 ? { ok: true, data: { running: true } } : { ok: true, data: { hits: mockSearch(query) } };
  }
  if (provider !== "apify") return { ok: false, reason: "upstream", message: "no runs with this provider" };
  const r = await apifyPoll(runId);
  if (r.ok && "hits" in r.data) {
    remember(`s:apify:${query.toLowerCase()}`, r.data.hits);
    rememberCards(r.data.hits);
    cache.delete(`r:${query.toLowerCase()}`);
  }
  return r;
}

/** Full card of a company by provider id or by VAT number / tax code. */
export async function getCompany(idOrVat: string): Promise<LookupResult<Party | null>> {
  const key = clean(idOrVat);
  if (!/^[A-Za-z0-9-]{1,64}$/.test(key)) return { ok: true, data: null };
  const provider = companyEnv.provider();
  if (!provider) return { ok: false, reason: "disabled" };
  if (provider === "mock") return { ok: true, data: mockGet(key) };
  const known = recall<Party>(`c:${key}`, 24 * 60 * MIN);
  if (known) return { ok: true, data: known };
  // the Apify provider only knows the cards its searches brought in
  if (provider === "apify") return { ok: true, data: null };
  return cached(`c:${key}`, 60 * MIN, async () => {
    const r = await callOpenapi(`/IT-start/${encodeURIComponent(key)}`);
    if (!r.ok) return r;
    return { ok: true, data: r.data[0] ? toParty(r.data[0]) : null };
  });
}
