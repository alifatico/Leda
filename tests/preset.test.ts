import { describe, expect, it } from "vitest";
import { applyPreset, computeTotals, hasPreset, newLineItem, newQuote } from "@/lib/quote";

const base = () => newQuote({ id: "t", createdAt: 1, date: "2026-01-01", items: [newLineItem({ id: "a", vatRate: 22 }), newLineItem({ id: "b", vatRate: 22, unitPrice: 50 })] });

describe("URL presets", () => {
  it("detects preset parameters", () => {
    expect(hasPreset(new URLSearchParams("amount=10"))).toBe(true);
    expect(hasPreset(new URLSearchParams("doc=x&template=y"))).toBe(false);
  });

  it("applies regime, fund contribution, withholding, VAT and amount", () => {
    const q = applyPreset(base(), new URLSearchParams("regime=ordinario&rivalsa=cassa&ritenuta=20&vat=22&amount=1000"));
    expect(q.options.rivalsaKind).toBe("cassa");
    expect(q.items[0].unitPrice).toBe(1000);
    expect(q.items[0].quantity).toBe(1);
    expect(q.items[1].unitPrice).toBe(50);
    const t = computeTotals(q);
    expect(t.ritenuta).toBe(210);
    expect(t.total).toBe(1332.24);
  });

  it("occasional work ignores the rivalsa and forfettario ignores the withholding", () => {
    const occ = applyPreset(base(), new URLSearchParams("regime=occasionale&rivalsa=4&amount=500"));
    expect(occ.options.prestazioneOccasionale).toBe(true);
    expect(occ.options.rivalsaInpsPct).toBe(0);
    expect(computeTotals(occ).ritenuta).toBe(110);
    const forf = applyPreset(base(), new URLSearchParams("regime=forfettario&ritenuta=20&rivalsa=4"));
    expect(forf.options.regimeForfettario).toBe(true);
    expect(forf.options.ritenutaAccontoPct).toBe(0);
    expect(forf.options.rivalsaInpsPct).toBe(4);
  });

  it("ignores garbage and leaves the quote untouched without parameters", () => {
    const q0 = base();
    expect(applyPreset(q0, new URLSearchParams(""))).toEqual(q0);
    const q = applyPreset(q0, new URLSearchParams("amount=abc&vat=zz&ritenuta=200&regime=what"));
    expect(q.items[0].unitPrice).toBe(0);
    expect(q.items[0].vatRate).toBe(22);
    expect(q.options.ritenutaAccontoPct).toBe(100);
    expect(q.options.regimeForfettario).toBe(false);
    expect(applyPreset(q0, new URLSearchParams("vat=-5")).items[0].vatRate).toBe(0);
  });
});
