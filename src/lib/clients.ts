/**
 * Client address book, built from the quotes the user already wrote.
 * Pure helpers only: the persistence lives in storage.ts (`clientsStore`).
 *
 * One entry per quote (keyed by quote id) so that autosave never leaves half-typed
 * names behind; the book shown to the user is deduplicated by name at read time.
 */
import type { Party } from "./quote";

export type SavedClient = { quoteId: string; party: Party; updatedAt: number };

export const CLIENT_FIELDS = ["vat", "taxCode", "address", "zip", "city", "province", "country", "email", "phone", "pec", "sdi", "website"] as const satisfies readonly (keyof Party)[];

/** Case, accent and whitespace insensitive key for a company name. */
export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Trimmed value of a field; tolerant of odd data coming back from storage. */
const field = (p: Party, k: keyof Party): string => (typeof p[k] === "string" ? p[k].trim() : "");

/** Trim every field and drop the empty ones. */
export function cleanParty(p: Party): Party {
  const out: Party = { name: field(p, "name") };
  for (const k of CLIENT_FIELDS) {
    const v = field(p, k);
    if (v) out[k] = v;
  }
  return out;
}

/** True when the party carries anything beyond the name. */
export function hasDetails(p: Party): boolean {
  return CLIENT_FIELDS.some((k) => field(p, k));
}

/**
 * One client per name, most recent first. The latest version wins, except that a
 * bare name (typed by hand, nothing else) never replaces a card with details.
 */
export function dedupeClients(entries: SavedClient[]): Party[] {
  const byName = new Map<string, SavedClient>();
  for (const e of entries) {
    const key = normalizeName(e.party.name);
    if (!key) continue;
    const cur = byName.get(key);
    if (!cur) {
      byName.set(key, e);
      continue;
    }
    const rich = hasDetails(e.party);
    const curRich = hasDetails(cur.party);
    if (rich !== curRich ? rich : e.updatedAt > cur.updatedAt) byName.set(key, e);
  }
  return [...byName.values()].sort((a, b) => b.updatedAt - a.updatedAt).map((e) => cleanParty(e.party));
}

/** Exact match on the name, if the book knows it. */
export function findClient(book: Party[], name: string): Party | undefined {
  const key = normalizeName(name);
  return key ? book.find((p) => normalizeName(p.name) === key) : undefined;
}

/**
 * Clients matching what the user typed: names starting with the text first, then
 * names containing it, then VAT number, tax code or e-mail. An empty query lists
 * the most recent clients.
 */
export function searchClients(book: Party[], query: string, limit = 6): Party[] {
  const q = normalizeName(query);
  if (!q) return book.slice(0, limit);
  const starts: Party[] = [];
  const contains: Party[] = [];
  const other: Party[] = [];
  for (const p of book) {
    const name = normalizeName(p.name);
    if (name.startsWith(q)) starts.push(p);
    else if (name.includes(q)) contains.push(p);
    else if ([p.vat, p.taxCode, p.email].some((v) => v && normalizeName(v).includes(q))) other.push(p);
  }
  return [...starts, ...contains, ...other].slice(0, limit);
}

/** One line of context for a suggestion row, e.g. "Milano · IT01234567890". */
export function clientSummary(p: Party): string {
  return [p.city, p.vat || p.taxCode, p.email].filter(Boolean).join(" · ");
}
