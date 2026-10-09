import { describe, expect, it } from "vitest";
import { resolveDesign, safeParseQuote, sampleQuote, STYLE_IDS, STYLES } from "@/lib/quote";

describe("document design", () => {
  it("defaults to the classic look when nothing is set", () => {
    const d = resolveDesign(sampleQuote("it"));
    expect(d.style).toBe("classico");
    expect(d.columns).toEqual({ qty: true, unitPrice: true, vat: true });
    expect(d.labels.quote).toBe("PREVENTIVO");
    expect(d.cover).toBeNull();
    expect(d.showSignature).toBe(true);
  });

  it("applies label overrides on top of the document language and ignores blanks", () => {
    const q = sampleQuote("en");
    q.design = { style: "elegante", labels: { title: " OFFER ", netPayable: "", to: "Prepared for" }, columns: { qty: false }, intro: "  Dear client,  ", cover: { enabled: true, title: "Website" } };
    const d = resolveDesign(q);
    expect(d.style).toBe("elegante");
    expect(d.tokens.font).toBe("times");
    expect(d.labels.quote).toBe("OFFER");
    expect(d.labels.netPayable).toBe("Net payable");
    expect(d.labels.to).toBe("Prepared for");
    expect(d.columns).toEqual({ qty: false, unitPrice: true, vat: true });
    expect(d.intro).toBe("Dear client,");
    expect(d.cover).toEqual({ title: "Website", subtitle: "", image: undefined });
  });

  it("every style id has tokens and the schema validates the design block", () => {
    for (const id of STYLE_IDS) expect(STYLES[id]).toBeDefined();
    const base = JSON.parse(JSON.stringify(sampleQuote("it")));
    expect(safeParseQuote({ ...base, design: { style: "moderno", labels: { title: "OFFERTA" }, cover: { enabled: false } } }).ok).toBe(true);
    expect(safeParseQuote({ ...base, design: { style: "neon" } }).ok).toBe(false);
    expect(safeParseQuote({ ...base, design: { labels: { title: "x".repeat(61) } } }).ok).toBe(false);
    expect(safeParseQuote({ ...base, design: { cover: { enabled: true, image: "data:text/html;base64,AAAA" } } }).ok).toBe(false);
  });
});
