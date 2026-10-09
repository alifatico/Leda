import { describe, expect, it } from "vitest";
import { cleanParty, dedupeClients, findClient, hasDetails, normalizeName, searchClients, type SavedClient } from "@/lib/clients";

const entry = (quoteId: string, updatedAt: number, party: SavedClient["party"]): SavedClient => ({ quoteId, updatedAt, party });

const book = dedupeClients([
  entry("q1", 100, { name: "Trattoria Da Gino", vat: "IT01234567890", city: "Milano", email: "gino@example.it" }),
  entry("q2", 200, { name: "Studio Rossi & Associati", taxCode: "RSSMRA80A01H501U", city: "Roma" }),
  entry("q3", 300, { name: "Bar Centrale", city: "Torino" }),
]);

describe("client address book", () => {
  it("normalises names ignoring case, accents and spacing", () => {
    expect(normalizeName("  Caffè   DELL'ANGOLO ")).toBe("caffe dell'angolo");
  });

  it("cleans a party: trims and drops the empty fields", () => {
    const p = cleanParty({ name: " Acme ", vat: " ", city: " Milano ", email: "" });
    expect(p).toEqual({ name: "Acme", city: "Milano" });
    expect(hasDetails(p)).toBe(true);
    expect(hasDetails({ name: "Acme", vat: "  " })).toBe(false);
  });

  it("keeps one client per name, most recent first", () => {
    const list = dedupeClients([
      entry("q1", 100, { name: "Acme Srl", vat: "IT1", city: "Milano" }),
      entry("q2", 200, { name: "ACME SRL", vat: "IT1", city: "Bergamo" }),
      entry("q3", 150, { name: "Beta Snc", city: "Como" }),
      entry("q4", 50, { name: "   " }),
    ]);
    expect(list.map((p) => p.name)).toEqual(["ACME SRL", "Beta Snc"]);
    expect(list[0].city).toBe("Bergamo");
  });

  it("never lets a bare name (typed by hand) replace a card with details", () => {
    const list = dedupeClients([
      entry("q1", 100, { name: "Acme Srl", vat: "IT1", city: "Milano" }),
      entry("q2", 999, { name: "acme srl" }),
    ]);
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual({ name: "Acme Srl", vat: "IT1", city: "Milano" });
  });

  it("searches by name prefix first, then by substring, then by VAT, tax code or e-mail", () => {
    // "Bar Centrale" contains "tra" too, but a name starting with the text comes first
    expect(searchClients(book, "tra").map((p) => p.name)).toEqual(["Trattoria Da Gino", "Bar Centrale"]);
    expect(searchClients(book, "ROSSI").map((p) => p.name)).toEqual(["Studio Rossi & Associati"]);
    expect(searchClients(book, "01234").map((p) => p.name)).toEqual(["Trattoria Da Gino"]);
    expect(searchClients(book, "gino@").map((p) => p.name)).toEqual(["Trattoria Da Gino"]);
    expect(searchClients(book, "zzz")).toEqual([]);
    const ordered = dedupeClients([entry("a", 1, { name: "Gino Bar" }), entry("b", 2, { name: "Bar Gino" })]);
    expect(searchClients(ordered, "gino").map((p) => p.name)).toEqual(["Gino Bar", "Bar Gino"]);
  });

  it("lists the most recent clients for an empty query, bounded by the limit", () => {
    expect(searchClients(book, "").map((p) => p.name)).toEqual(["Bar Centrale", "Studio Rossi & Associati", "Trattoria Da Gino"]);
    expect(searchClients(book, "  ", 2)).toHaveLength(2);
  });

  it("finds an exact name whatever the case or accents", () => {
    expect(findClient(book, "bar centrale")?.city).toBe("Torino");
    expect(findClient(book, "Bar")).toBeUndefined();
    expect(findClient(book, "")).toBeUndefined();
  });
});
