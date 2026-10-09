import { describe, expect, it } from "vitest";
import { sampleQuote } from "@/lib/quote";
import { createQuoteFromSaved, templateFromQuote } from "@/lib/storage";

describe("saved templates", () => {
  it("keeps look, texts, items and options but never the client, and gives fresh ids", () => {
    const q = sampleQuote("it");
    q.design = { style: "moderno", intro: "Gentile cliente", labels: { title: "OFFERTA" } };
    const tpl = templateFromQuote(q, "Sito vetrina");
    expect(tpl.name).toBe("Sito vetrina");
    expect("client" in tpl.data).toBe(false);
    const fresh = createQuoteFromSaved(tpl);
    expect(fresh.id).not.toBe(q.id);
    expect(fresh.client.name).toBe("");
    expect(fresh.subject).toBe(q.subject);
    expect(fresh.items.map((i) => i.description)).toEqual(q.items.map((i) => i.description));
    expect(fresh.items[0].id).not.toBe(q.items[0].id);
    expect(fresh.design?.style).toBe("moderno");
    expect(fresh.design?.labels?.title).toBe("OFFERTA");
    expect(fresh.options.depositPct).toBe(30);
  });
});
