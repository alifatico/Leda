import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCompany, isVatNumber, normalizeQuery, searchCompanies, titleCase, toHit, toParty, type RawCompany } from "@/lib/company";

/** The example record of company.openapi.com's "start" dataset. */
const SAMPLE: RawCompany = {
  taxCode: "12485671007",
  companyName: "OPENAPI S.P.A.",
  vatCode: "12485671007",
  address: {
    registeredOffice: { toponym: "VIALE", street: "F TOMMASO MARINETTI", streetNumber: "221", streetName: "VIALE F TOMMASO MARINETTI 221", town: "ROMA", hamlet: null, province: "RM", zipCode: "00143" },
  },
  activityStatus: "ATTIVA",
  sdiCode: "USAL8PV",
  id: "60b4a85585e34e615c569ef5",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("business register lookup", () => {
  it("title-cases streets and towns, keeping roman numerals and joining words", () => {
    expect(titleCase("VIALE F TOMMASO MARINETTI 221")).toBe("Viale F Tommaso Marinetti 221");
    expect(titleCase("CORSO VITTORIO EMANUELE II 45")).toBe("Corso Vittorio Emanuele II 45");
    expect(titleCase("VIA DELL'INDUSTRIA 100")).toBe("Via dell'Industria 100");
    expect(titleCase("PIAZZA DEL POPOLO")).toBe("Piazza del Popolo");
    expect(titleCase("SAN DONÀ DI PIAVE")).toBe("San Donà di Piave");
  });

  it("turns a register record into a full client card", () => {
    expect(toParty(SAMPLE)).toEqual({
      name: "OPENAPI S.P.A.",
      vat: "12485671007",
      address: "Viale F Tommaso Marinetti 221",
      zip: "00143",
      city: "Roma",
      province: "RM",
      country: "Italia",
      sdi: "USAL8PV",
    });
    expect(toParty({ companyName: "  " })).toBeNull();
  });

  it("keeps the tax code only when it differs from the VAT number and composes the street when needed", () => {
    const p = toParty({ id: "x", companyName: "ROSSI MARIO", vatCode: "11223344556", taxCode: "RSSMRA80A01H501U", address: { registeredOffice: { toponym: "VIA", street: "ROMA", streetNumber: "1", town: "MILANO", province: "mi" } } });
    expect(p).toMatchObject({ taxCode: "RSSMRA80A01H501U", address: "Via Roma 1", city: "Milano", province: "MI" });
    expect(p?.zip).toBeUndefined();
  });

  it("builds suggestion rows", () => {
    expect(toHit(SAMPLE)).toEqual({ id: "60b4a85585e34e615c569ef5", name: "OPENAPI S.P.A.", vat: "12485671007", city: "Roma", province: "RM" });
    expect(toHit({ companyName: "NO ID" })).toBeNull();
  });

  it("normalises the query and recognises VAT numbers", () => {
    expect(normalizeQuery("  trattoria   da  gino ")).toBe("trattoria da gino");
    expect(normalizeQuery("x".repeat(100))).toHaveLength(80);
    expect(isVatNumber("01234567890")).toBe(true);
    expect(isVatNumber("IT01234567890")).toBe(false);
  });

  describe("mock provider (COMPANY_LOOKUP=mock)", () => {
    beforeEach(() => {
      process.env.COMPANY_LOOKUP = "mock";
    });
    afterEach(() => {
      delete process.env.COMPANY_LOOKUP;
    });

    it("searches by name or VAT number and already carries the full card", async () => {
      const r = await searchCompanies("trattoria");
      expect(r.ok && r.data.map((h) => h.name)).toEqual(["TRATTORIA DA GINO S.R.L."]);
      expect(r.ok && r.data[0].party).toMatchObject({ vat: "01234567890", address: "Via Roma 12", city: "Milano", sdi: "M5UXCR1" });
      const byVat = await searchCompanies("09876543210");
      expect(byVat.ok && byVat.data.map((h) => h.name)).toEqual(["STUDIO ROSSI & ASSOCIATI"]);
      expect(await searchCompanies("zz")).toEqual({ ok: true, data: [] });
    });

    it("fetches a company by id or VAT number", async () => {
      const byId = await getCompany("mock-3");
      expect(byId.ok && byId.data?.taxCode).toBe("RSSMRA80A01H501U");
      const byVat = await getCompany("55667788990");
      expect(byVat.ok && byVat.data?.name).toBe("BAR CENTRALE DI BIANCHI LUCA");
      expect(await getCompany("nope")).toEqual({ ok: true, data: null });
      expect(await getCompany("bad id!")).toEqual({ ok: true, data: null });
    });
  });

  describe("openapi.com provider", () => {
    beforeEach(() => {
      delete process.env.COMPANY_LOOKUP;
      process.env.OPENAPI_COMPANY_TOKEN = "test-token";
    });
    afterEach(() => {
      vi.unstubAllGlobals();
      delete process.env.OPENAPI_COMPANY_TOKEN;
    });

    it("is disabled without a token", async () => {
      delete process.env.OPENAPI_COMPANY_TOKEN;
      expect(await searchCompanies("trattoria")).toEqual({ ok: false, reason: "disabled" });
    });

    it("autocompletes through IT-search with the name enrichment and caches the answer", async () => {
      const fetchMock = vi.fn(async () => json({ data: [SAMPLE], success: true, message: "", error: null }));
      vi.stubGlobal("fetch", fetchMock);
      const r = await searchCompanies("Openapi Spa");
      expect(r).toEqual({ ok: true, data: [{ id: "60b4a85585e34e615c569ef5", name: "OPENAPI S.P.A.", vat: "12485671007", city: "Roma", province: "RM" }] });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
      expect(url).toBe("https://company.openapi.com/IT-search?autocomplete=Openapi%20Spa&dataEnrichment=name&limit=8");
      expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
      await searchCompanies("openapi spa");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("looks a VAT number up directly through IT-start and returns the full card", async () => {
      const fetchMock = vi.fn(async () => json({ data: [SAMPLE], success: true }));
      vi.stubGlobal("fetch", fetchMock);
      const r = await searchCompanies("12485671007");
      expect(r.ok && r.data[0].party?.address).toBe("Viale F Tommaso Marinetti 221");
      expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toBe("https://company.openapi.com/IT-start/12485671007");
    });

    it("treats 204 as no results and maps provider failures", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
      expect(await searchCompanies("nessuno qui")).toEqual({ ok: true, data: [] });
      vi.stubGlobal("fetch", vi.fn(async () => json({ success: false, message: "Insufficient Credit", error: 610, data: null }, 402)));
      expect(await getCompany("99999999990")).toEqual({ ok: false, reason: "credit", message: "Insufficient Credit" });
      vi.stubGlobal("fetch", vi.fn(async () => json({ success: false, message: "unauthorized" }, 401)));
      expect(await getCompany("99999999991")).toMatchObject({ ok: false, reason: "auth" });
      vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("network down"))));
      expect(await getCompany("99999999992")).toEqual({ ok: false, reason: "upstream", message: "network down" });
    });
  });
});
