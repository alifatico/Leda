import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  apifyToHit,
  apifyToParty,
  getCompany,
  isVatNumber,
  normalizeQuery,
  parseItalianAddress,
  pollRun,
  searchCompanies,
  titleCase,
  toHit,
  toParty,
  type ApifyRecord,
  type RawCompany,
} from "@/lib/company";
import { companyEnv } from "@/lib/env";

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

/** The example record in the README of the Apify actor. */
const APIFY_SAMPLE: ApifyRecord = {
  vat_number: "00507231207",
  tax_code: "00507231207",
  rea_number: "BO-16539",
  legal_name: "BCC FELSINEA - BANCA DI CREDITO COOPERATIVO DAL 1902 - SOCIETA' COOPERATIVA",
  status: "ATTIVA",
  registered_address: "VIA CADUTI DI SABBIUNO 3 - 40068 - SAN LAZZARO DI SAVENA (BO)",
  pec_email: "BCCFelsinea@pec.bccfelsinea.it",
  phone: null,
  website: null,
  codice_destinatario: "m5uxcr1",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const ENV_KEYS = ["COMPANY_LOOKUP", "COMPANY_LOOKUP_MODE", "OPENAPI_COMPANY_TOKEN", "APIFY_TOKEN", "APIFY_COMPANY_MAX_ITEMS"];
function resetEnv() {
  for (const k of ENV_KEYS) delete process.env[k];
}

describe("business register lookup", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetEnv();
  });

  it("title-cases streets and towns, keeping roman numerals and joining words", () => {
    expect(titleCase("VIALE F TOMMASO MARINETTI 221")).toBe("Viale F Tommaso Marinetti 221");
    expect(titleCase("CORSO VITTORIO EMANUELE II 45")).toBe("Corso Vittorio Emanuele II 45");
    expect(titleCase("VIA DELL'INDUSTRIA 100")).toBe("Via dell'Industria 100");
    expect(titleCase("PIAZZA DEL POPOLO")).toBe("Piazza del Popolo");
    expect(titleCase("SAN DONÀ DI PIAVE")).toBe("San Donà di Piave");
  });

  it("turns an openapi record into a full client card", () => {
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

  it("splits an Italian registered-office address into street, ZIP, town and province", () => {
    expect(parseItalianAddress("VIA CADUTI DI SABBIUNO 3 - 40068 - SAN LAZZARO DI SAVENA (BO)")).toEqual({ address: "Via Caduti di Sabbiuno 3", zip: "40068", city: "San Lazzaro di Savena", province: "BO" });
    expect(parseItalianAddress("VIA ROMA 1, 20121 MILANO MI")).toEqual({ address: "Via Roma 1", zip: "20121", city: "Milano", province: "MI" });
    expect(parseItalianAddress("PIAZZA GARIBALDI 4 80142 NAPOLI")).toEqual({ address: "Piazza Garibaldi 4", zip: "80142", city: "Napoli" });
    expect(parseItalianAddress("LOCALITÀ SENZA CAP")).toEqual({ address: "Località Senza Cap" });
    expect(parseItalianAddress("  ")).toEqual({});
  });

  it("turns an Apify record into a full card and a suggestion row, skipping struck-off companies", () => {
    const party = apifyToParty(APIFY_SAMPLE);
    expect(party).toEqual({
      name: "BCC FELSINEA - BANCA DI CREDITO COOPERATIVO DAL 1902 - SOCIETA' COOPERATIVA",
      vat: "00507231207",
      address: "Via Caduti di Sabbiuno 3",
      zip: "40068",
      city: "San Lazzaro di Savena",
      province: "BO",
      country: "Italia",
      pec: "bccfelsinea@pec.bccfelsinea.it",
      sdi: "M5UXCR1",
    });
    const hit = apifyToHit(APIFY_SAMPLE);
    expect(hit).toMatchObject({ id: "00507231207", name: party?.name, vat: "00507231207", city: "San Lazzaro di Savena", province: "BO" });
    expect(hit?.party).toEqual(party);
    expect(apifyToParty({ ...APIFY_SAMPLE, status: "CESSATA" })).toBeNull();
    expect(apifyToParty({ legal_name: "DITTA SENZA DATI", vat_number: "IT01234567890", tax_code: "RSSMRA80A01H501U" })).toEqual({ name: "DITTA SENZA DATI", vat: "01234567890", taxCode: "RSSMRA80A01H501U", country: "Italia" });
  });

  it("picks the provider and the lookup mode from the environment", () => {
    expect(companyEnv.provider()).toBeNull();
    expect(companyEnv.mode()).toBe("off");
    process.env.APIFY_TOKEN = "apify_api_x";
    expect(companyEnv.provider()).toBe("apify");
    expect(companyEnv.mode()).toBe("on-demand");
    process.env.OPENAPI_COMPANY_TOKEN = "t";
    expect(companyEnv.provider()).toBe("openapi");
    expect(companyEnv.mode()).toBe("autocomplete");
    process.env.COMPANY_LOOKUP = "apify";
    expect(companyEnv.provider()).toBe("apify");
    process.env.COMPANY_LOOKUP_MODE = "autocomplete";
    expect(companyEnv.mode()).toBe("autocomplete");
    process.env.COMPANY_LOOKUP = "off";
    expect(companyEnv.mode()).toBe("off");
    process.env.COMPANY_LOOKUP = "mock";
    expect(companyEnv.provider()).toBe("mock");
  });

  describe("mock provider (COMPANY_LOOKUP=mock)", () => {
    beforeEach(() => {
      process.env.COMPANY_LOOKUP = "mock";
    });

    it("searches by name or VAT number and already carries the full card", async () => {
      const r = await searchCompanies("trattoria");
      expect(r.ok && "hits" in r.data && r.data.hits.map((h) => h.name)).toEqual(["TRATTORIA DA GINO S.R.L."]);
      expect(r.ok && "hits" in r.data && r.data.hits[0].party).toMatchObject({ vat: "01234567890", address: "Via Roma 12", city: "Milano", sdi: "M5UXCR1" });
      const byVat = await searchCompanies("09876543210");
      expect(byVat.ok && "hits" in byVat.data && byVat.data.hits.map((h) => h.name)).toEqual(["STUDIO ROSSI & ASSOCIATI"]);
      expect(await searchCompanies("zz")).toEqual({ ok: true, data: { hits: [] } });
    });

    it("fetches a company by id or VAT number", async () => {
      const byId = await getCompany("mock-3");
      expect(byId.ok && byId.data?.taxCode).toBe("RSSMRA80A01H501U");
      const byVat = await getCompany("55667788990");
      expect(byVat.ok && byVat.data?.name).toBe("BAR CENTRALE DI BIANCHI LUCA");
      expect(await getCompany("nope")).toEqual({ ok: true, data: null });
      expect(await getCompany("bad id!")).toEqual({ ok: true, data: null });
    });

    it("behaves like a run in on-demand mode: a run id, one poll in progress, then the records", async () => {
      process.env.COMPANY_LOOKUP_MODE = "on-demand";
      const r = await searchCompanies("rossi");
      expect(r.ok && "runId" in r.data).toBe(true);
      const runId = r.ok && "runId" in r.data ? r.data.runId : "";
      expect(await pollRun(runId, "rossi")).toEqual({ ok: true, data: { running: true } });
      const done = await pollRun(runId, "rossi");
      expect(done.ok && "hits" in done.data && done.data.hits.map((h) => h.name)).toEqual(["STUDIO ROSSI & ASSOCIATI", "ROSSI MARIO"]);
      expect(await pollRun("mock-run-unknown", "x")).toMatchObject({ ok: false, reason: "upstream" });
    });
  });

  describe("openapi.com provider", () => {
    beforeEach(() => {
      process.env.OPENAPI_COMPANY_TOKEN = "test-token";
    });

    it("is disabled without any token", async () => {
      resetEnv();
      expect(await searchCompanies("trattoria")).toEqual({ ok: false, reason: "disabled" });
    });

    it("autocompletes through IT-search with the name enrichment and caches the answer", async () => {
      const fetchMock = vi.fn(async () => json({ data: [SAMPLE], success: true, message: "", error: null }));
      vi.stubGlobal("fetch", fetchMock);
      const r = await searchCompanies("Openapi Spa");
      expect(r).toEqual({ ok: true, data: { hits: [{ id: "60b4a85585e34e615c569ef5", name: "OPENAPI S.P.A.", vat: "12485671007", city: "Roma", province: "RM" }] } });
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
      expect(r.ok && "hits" in r.data && r.data.hits[0].party?.address).toBe("Viale F Tommaso Marinetti 221");
      expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toBe("https://company.openapi.com/IT-start/12485671007");
    });

    it("treats 204 as no results and maps provider failures", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
      expect(await searchCompanies("nessuno qui")).toEqual({ ok: true, data: { hits: [] } });
      vi.stubGlobal("fetch", vi.fn(async () => json({ success: false, message: "Insufficient Credit", error: 610, data: null }, 402)));
      expect(await getCompany("99999999990")).toEqual({ ok: false, reason: "credit", message: "Insufficient Credit" });
      vi.stubGlobal("fetch", vi.fn(async () => json({ success: false, message: "unauthorized" }, 401)));
      expect(await getCompany("99999999991")).toMatchObject({ ok: false, reason: "auth" });
      vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("network down"))));
      expect(await getCompany("99999999992")).toEqual({ ok: false, reason: "upstream", message: "network down" });
    });
  });

  describe("Apify provider", () => {
    beforeEach(() => {
      process.env.APIFY_TOKEN = "apify_api_test";
      process.env.APIFY_COMPANY_MAX_ITEMS = "5";
    });

    it("starts a run, reports it while running, then maps the dataset and caches the cards", async () => {
      const calls: { url: string; init?: RequestInit }[] = [];
      let polls = 0;
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string, init?: RequestInit) => {
          calls.push({ url, init });
          if (url.includes("/runs?")) return json({ data: { id: "run123", status: "READY", defaultDatasetId: "ds9" } }, 201);
          if (url.includes("/actor-runs/run123")) return json({ data: { id: "run123", status: ++polls < 2 ? "RUNNING" : "SUCCEEDED", defaultDatasetId: "ds9" } });
          if (url.includes("/datasets/ds9/items")) return json([APIFY_SAMPLE, { ...APIFY_SAMPLE, legal_name: "CHIUSA SRL", vat_number: "11111111111", status: "CESSATA" }]);
          return json({ error: { message: "unexpected" } }, 500);
        }),
      );
      const started = await searchCompanies("BCC Felsinea");
      expect(started).toEqual({ ok: true, data: { runId: "run123" } });
      expect(calls[0].url).toBe("https://api.apify.com/v2/acts/jungle_synthesizer~italy-registroimprese-bilanci-scraper/runs?timeout=120");
      expect(calls[0].init?.method).toBe("POST");
      expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe("Bearer apify_api_test");
      expect(JSON.parse(String(calls[0].init?.body))).toEqual({ mode: "by_name", query: "BCC Felsinea", includePec: true, maxItems: 5 });
      // the same query while the run is in progress reuses the run instead of paying for another
      expect(await searchCompanies("bcc felsinea")).toEqual({ ok: true, data: { runId: "run123" } });

      expect(await pollRun("run123", "BCC Felsinea")).toEqual({ ok: true, data: { running: true } });
      expect(calls[1].url).toBe("https://api.apify.com/v2/actor-runs/run123?waitForFinish=5");
      const done = await pollRun("run123", "BCC Felsinea");
      expect(done.ok && "hits" in done.data && done.data.hits.map((h) => h.name)).toEqual([APIFY_SAMPLE.legal_name]);
      expect(done.ok && "hits" in done.data && done.data.hits[0].party?.pec).toBe("bccfelsinea@pec.bccfelsinea.it");
      expect(calls.at(-1)?.url).toBe("https://api.apify.com/v2/datasets/ds9/items?clean=true&format=json");

      // finished records answer the next identical search and the card endpoint without upstream calls
      const before = calls.length;
      expect(await searchCompanies("bcc felsinea")).toEqual(done);
      const card = await getCompany("00507231207");
      expect(card.ok && card.data).toEqual(done.ok && "hits" in done.data ? done.data.hits[0].party : null);
      expect(calls.length).toBe(before);
      expect(await getCompany("99999999999")).toEqual({ ok: true, data: null });
    });

    it("sends VAT numbers in by_vat_number mode and maps Apify failures", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => json({ error: { type: "insufficient-credit", message: "Monthly usage hard limit exceeded" } }, 402)));
      expect(await searchCompanies("01234567891")).toEqual({ ok: false, reason: "credit", message: "Monthly usage hard limit exceeded" });
      vi.stubGlobal("fetch", vi.fn(async () => json({ data: { id: "runFail", status: "FAILED" } })));
      expect(await pollRun("runFail", "qualcosa")).toEqual({ ok: false, reason: "upstream", message: "run failed" });
      const fetchMock = vi.fn(async () => json({ data: { id: "run777", status: "READY" } }, 201));
      vi.stubGlobal("fetch", fetchMock);
      await searchCompanies("12345678903");
      expect(JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body))).toMatchObject({ mode: "by_vat_number", query: "12345678903" });
    });
  });
});
