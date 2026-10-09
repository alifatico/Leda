import { describe, expect, it } from "vitest";
import {
  computeTotals,
  newQuote,
  newLineItem,
  nextQuoteNumber,
  validUntil,
  sampleQuote,
  safeParseQuote,
  formatMoney,
} from "@/lib/quote";
import type { Quote } from "@/lib/quote";

function q(items: Parameters<typeof newLineItem>[0][], options: Partial<Quote["options"]> = {}): Quote {
  const base = newQuote({ items: items.map((i) => newLineItem(i)) });
  return { ...base, options: { ...base.options, ...options } };
}

describe("computeTotals", () => {
  it("handles a single line with 22% VAT", () => {
    const t = computeTotals(q([{ quantity: 1, unitPrice: 100, vatRate: 22 }]));
    expect(t.subtotal).toBe(100);
    expect(t.net).toBe(100);
    expect(t.vatTotal).toBe(22);
    expect(t.total).toBe(122);
    expect(t.netPayable).toBe(122);
    expect(t.bollo).toBe(0);
    expect(t.vatGroups).toEqual([{ rate: 22, base: 100, vat: 22 }]);
  });

  it("applies line and global discounts before VAT", () => {
    const t = computeTotals(
      q([{ quantity: 1, unitPrice: 100, vatRate: 22, discountPct: 10 }], { globalDiscountPct: 5 }),
    );
    expect(t.subtotal).toBe(100);
    expect(t.lineDiscounts).toBe(10);
    expect(t.globalDiscount).toBe(4.5);
    expect(t.net).toBe(85.5);
    expect(t.vatTotal).toBe(18.81);
    expect(t.total).toBe(104.31);
  });

  it("computes rivalsa INPS 4% and ritenuta d'acconto 20% like an Italian professional invoice", () => {
    const t = computeTotals(
      q([{ quantity: 1, unitPrice: 1000, vatRate: 22 }], { rivalsaInpsPct: 4, ritenutaAccontoPct: 20 }),
    );
    expect(t.net).toBe(1000);
    expect(t.rivalsa).toBe(40);
    expect(t.taxable).toBe(1040);
    expect(t.vatTotal).toBe(228.8);
    expect(t.total).toBe(1268.8);
    expect(t.ritenuta).toBe(208);
    expect(t.netPayable).toBe(1060.8);
  });

  it("forces VAT 0, no withholding and stamp duty under regime forfettario", () => {
    const t = computeTotals(
      q([{ quantity: 1, unitPrice: 1000, vatRate: 22 }], { regimeForfettario: true, ritenutaAccontoPct: 20 }),
    );
    expect(t.vatTotal).toBe(0);
    expect(t.vatGroups).toEqual([{ rate: 0, base: 1000, vat: 0 }]);
    expect(t.bollo).toBe(2);
    expect(t.ritenuta).toBe(0);
    expect(t.total).toBe(1002);
    expect(t.netPayable).toBe(1002);
  });

  it("charges stamp duty only above the €77.47 exempt threshold", () => {
    expect(computeTotals(q([{ quantity: 1, unitPrice: 77.47, vatRate: 0 }])).bollo).toBe(0);
    expect(computeTotals(q([{ quantity: 1, unitPrice: 77.48, vatRate: 0 }])).bollo).toBe(2);
    expect(computeTotals(q([{ quantity: 1, unitPrice: 500, vatRate: 0 }], { bollo: false })).bollo).toBe(0);
  });

  it("groups VAT by rate, highest first, and mixes exempt lines", () => {
    const t = computeTotals(
      q([
        { quantity: 1, unitPrice: 100, vatRate: 0 },
        { quantity: 2, unitPrice: 50, vatRate: 22 },
        { quantity: 1, unitPrice: 10, vatRate: 10 },
      ]),
    );
    expect(t.vatGroups.map((g) => g.rate)).toEqual([22, 10, 0]);
    expect(t.vatTotal).toBe(23);
    expect(t.bollo).toBe(2);
    expect(t.total).toBe(235);
  });

  it("computes the deposit on the net payable amount", () => {
    const t = computeTotals(
      q([{ quantity: 1, unitPrice: 1000, vatRate: 22 }], { depositPct: 30, ritenutaAccontoPct: 20 }),
    );
    expect(t.netPayable).toBe(1020);
    expect(t.deposit).toBe(306);
  });

  it("rounds to cents without float drift", () => {
    const t = computeTotals(q([{ quantity: 3, unitPrice: 0.1, vatRate: 22 }]));
    expect(t.net).toBe(0.3);
    expect(t.vatTotal).toBe(0.07);
    expect(t.total).toBe(0.37);
  });

  it("ignores NaN and negative percentages gracefully", () => {
    const t = computeTotals(
      q([{ quantity: Number.NaN, unitPrice: 100, vatRate: 22 }], { globalDiscountPct: -5 }),
    );
    expect(t.total).toBe(0);
  });
});

describe("helpers", () => {
  it("computes the validity date", () => {
    const quote = newQuote({ date: "2026-01-31", validityDays: 30 });
    expect(validUntil(quote).toISOString().slice(0, 10)).toBe("2026-03-02");
  });

  it("generates the next sequential quote number per year", () => {
    expect(nextQuoteNumber(["PRV-2026-003", "PRV-2025-010", "x"], new Date("2026-06-01"))).toBe("PRV-2026-004");
    expect(nextQuoteNumber([], new Date("2026-06-01"))).toBe("PRV-2026-001");
  });

  it("formats money in the document language", () => {
    expect(formatMoney(1234.5, "EUR", "it")).toMatch(/1\.234,50/);
    expect(formatMoney(1234.5, "EUR", "en")).toMatch(/1,234\.50/);
  });

  it("validates the sample quote and rejects a bad colour", () => {
    expect(safeParseQuote(sampleQuote("it")).ok).toBe(true);
    const bad = { ...sampleQuote("en"), branding: { color: "blue" } };
    const r = safeParseQuote(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("branding.color");
  });

  it("the sample quote totals are what the landing page shows", () => {
    const t = computeTotals(sampleQuote("it"));
    expect(t.subtotal).toBe(2870);
    expect(t.vatTotal).toBe(631.4);
    expect(t.total).toBe(3501.4);
    expect(t.deposit).toBe(1050.42);
  });
});

describe("prestazione occasionale and fund contributions", () => {
  it("occasional work: no VAT, no rivalsa, withholding on the fee, stamp duty above 77.47", () => {
    const t = computeTotals(
      q([{ quantity: 1, unitPrice: 1000, vatRate: 22 }], { prestazioneOccasionale: true, rivalsaInpsPct: 4, ritenutaAccontoPct: 20 }),
    );
    expect(t.rivalsa).toBe(0);
    expect(t.vatTotal).toBe(0);
    expect(t.vatGroups).toEqual([{ rate: 0, base: 1000, vat: 0 }]);
    expect(t.bollo).toBe(2);
    expect(t.total).toBe(1002);
    expect(t.ritenuta).toBe(200);
    expect(t.netPayable).toBe(802);
  });

  it("occasional work below the stamp-duty threshold and with a private client (no withholding)", () => {
    const t = computeTotals(q([{ quantity: 1, unitPrice: 70, vatRate: 22 }], { prestazioneOccasionale: true, ritenutaAccontoPct: 0 }));
    expect(t.bollo).toBe(0);
    expect(t.total).toBe(70);
    expect(t.netPayable).toBe(70);
  });

  it("forfettario wins over occasionale when both are set", () => {
    const t = computeTotals(
      q([{ quantity: 1, unitPrice: 1000, vatRate: 22 }], { regimeForfettario: true, prestazioneOccasionale: true, ritenutaAccontoPct: 20 }),
    );
    expect(t.ritenuta).toBe(0);
    expect(t.vatTotal).toBe(0);
  });

  it("fund contribution (Inarcassa-style) is subject to VAT but excluded from the withholding base", () => {
    const t = computeTotals(
      q([{ quantity: 1, unitPrice: 1000, vatRate: 22 }], { rivalsaInpsPct: 4, rivalsaKind: "cassa", ritenutaAccontoPct: 20 }),
    );
    expect(t.rivalsa).toBe(40);
    expect(t.taxable).toBe(1040);
    expect(t.vatTotal).toBe(228.8);
    expect(t.total).toBe(1268.8);
    expect(t.ritenuta).toBe(200);
    expect(t.netPayable).toBe(1068.8);
  });

  it("INPS rivalsa stays in the withholding base (default kind)", () => {
    const t = computeTotals(q([{ quantity: 1, unitPrice: 1000, vatRate: 22 }], { rivalsaInpsPct: 4, rivalsaKind: "inps", ritenutaAccontoPct: 20 }));
    expect(t.ritenuta).toBe(208);
  });

  it("schema accepts quotes saved before these options existed and the new values", () => {
    const old = JSON.parse(JSON.stringify(sampleQuote("it")));
    delete old.options.rivalsaKind;
    delete old.options.prestazioneOccasionale;
    expect(safeParseQuote(old).ok).toBe(true);
    const withNew = { ...old, options: { ...old.options, rivalsaKind: "cassa", prestazioneOccasionale: true } };
    const r = safeParseQuote(withNew);
    expect(r.ok).toBe(true);
    expect(safeParseQuote({ ...old, options: { ...old.options, rivalsaKind: "other" } }).ok).toBe(false);
  });
});
