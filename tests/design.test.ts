import { describe, expect, it } from "vitest";
import { computeTotals, headlineAmount, monogram, resolveDesign, safeParseQuote, sampleQuote, STYLE_IDS, STYLES } from "@/lib/quote";

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
    expect(d.tokens.font).toBe("lora");
    expect(d.tokens.display).toBe("playfair");
    expect(d.tokens.layout).toBe("masthead");
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

describe("style tokens", () => {
  it("gives every style its own layout and typeface, so the six documents do not look alike", () => {
    const layouts = new Set(STYLE_IDS.map((id) => STYLES[id].layout));
    const fonts = new Set(STYLE_IDS.map((id) => STYLES[id].font));
    expect(layouts.size).toBe(STYLE_IDS.length);
    expect(fonts.size).toBe(STYLE_IDS.length);
  });

  it("accepts the studio style and resolves its sidebar tokens", () => {
    const q = sampleQuote("it");
    q.design = { style: "studio" };
    const d = resolveDesign(q);
    expect(d.tokens.layout).toBe("sidebar");
    expect(d.tokens.heroTotal).toBe(true);
    expect(safeParseQuote({ ...JSON.parse(JSON.stringify(q)) }).ok).toBe(true);
  });

  it("derives the palette from the brand colour", () => {
    const q = sampleQuote("it");
    q.branding = { color: "#DC2626" };
    const d = resolveDesign(q);
    expect(d.palette.accent).toBe("#DC2626");
    expect(d.palette.onAccent).toBe("#FFFFFF");
    expect(d.palette.tint).not.toBe("#DC2626");
  });

  it("builds a monogram from the first two words and picks the amount the client pays", () => {
    expect(monogram("Studio Rossi Design")).toBe("SR");
    expect(monogram("  mario   rossi ")).toBe("MR");
    expect(monogram("Trattoria Da Gino S.r.l.")).toBe("TD");
    expect(monogram("")).toBe("");
    expect(monogram("& co")).toBe("C");
    const q = sampleQuote("it");
    const L = resolveDesign(q).labels;
    expect(headlineAmount(computeTotals(q), L).label).toBe(L.total);
    q.options = { ...q.options, ritenutaAccontoPct: 20 };
    const head = headlineAmount(computeTotals(q), L);
    expect(head.label).toBe(L.netPayable);
    expect(head.value).toBe(computeTotals(q).netPayable);
  });
});
