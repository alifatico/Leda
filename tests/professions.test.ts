import { describe, expect, it } from "vitest";
import { professions, sampleQuoteFor, templateItems } from "@/lib/professions";
import { computeTotals, safeParseQuote } from "@/lib/quote";

describe("profession templates", () => {
  it("has unique slugs and complete content", () => {
    const slugs = professions.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const p of professions) {
      expect(p.slug).toMatch(/^[a-z-]+$/);
      expect(p.intro.length).toBeGreaterThanOrEqual(2);
      expect(p.items.length).toBeGreaterThanOrEqual(3);
      expect(p.tips.length).toBeGreaterThanOrEqual(3);
      expect(p.faq.length).toBeGreaterThanOrEqual(3);
      expect(p.metaDescription.length).toBeLessThanOrEqual(170);
      expect(p.title.length).toBeLessThanOrEqual(75);
    }
  });

  it("every sample quote validates, is deterministic and has a positive total", () => {
    for (const p of professions) {
      const q = sampleQuoteFor(p);
      const r = safeParseQuote(q);
      expect(r.ok, `${p.slug}: ${!r.ok ? r.error : ""}`).toBe(true);
      expect(JSON.stringify(sampleQuoteFor(p))).toBe(JSON.stringify(q));
      expect(computeTotals(q).total).toBeGreaterThan(0);
      expect(templateItems(p).every((i) => i.id.startsWith(p.slug))).toBe(true);
    }
  });

  it("architect template relabels the 4% surcharge", () => {
    const q = sampleQuoteFor(professions.find((p) => p.slug === "architetto")!);
    expect(q.options.rivalsaInpsPct).toBe(4);
    expect(q.options.rivalsaLabel).toContain("Inarcassa");
  });
});
