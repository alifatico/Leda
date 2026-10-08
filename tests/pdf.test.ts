import { describe, expect, it } from "vitest";
import { renderQuotePdf, pdfFilename } from "@/lib/pdf/render";
import { sampleQuote, newLineItem } from "@/lib/quote";
import { sanitizeForPdf } from "@/lib/pdf/sanitize";
import { writeFileSync } from "node:fs";

// Set PDF_OUT=/some/dir to also write the rendered PDFs for a visual check.
function dump(name: string, pdf: Uint8Array) {
  if (process.env.PDF_OUT) writeFileSync(`${process.env.PDF_OUT}/${name}`, pdf);
}

describe("PDF rendering", () => {
  it("renders the sample quote with a watermark", async () => {
    const q = sampleQuote("it");
    q.options = { ...q.options, rivalsaInpsPct: 4, ritenutaAccontoPct: 20 };
    const pdf = await renderQuotePdf(q, { watermark: true });
    dump("sample-it.pdf", pdf);
    const head = Buffer.from(pdf.subarray(0, 5)).toString("latin1");
    expect(head).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(3000);
    const text = Buffer.from(pdf).toString("latin1");
    expect(text).toContain("/Type /Page");
  }, 30000);

  it("renders a long English quote on multiple pages, with fiscal options", async () => {
    const q = sampleQuote("en");
    q.items = Array.from({ length: 45 }, (_, i) =>
      newLineItem({ id: `l${i}`, description: `Service line ${i + 1}`, details: "Details ".repeat(8), quantity: i + 1, unitPrice: 12.5, vatRate: i % 3 === 0 ? 0 : 22 }),
    );
    q.options = { ...q.options, rivalsaInpsPct: 4, ritenutaAccontoPct: 20, globalDiscountPct: 10, depositPct: 50 };
    const pdf = await renderQuotePdf(q, { watermark: false });
    dump("long-en.pdf", pdf);
    const text = Buffer.from(pdf).toString("latin1");
    const pages = (text.match(/\/Type \/Page[^s]/g) ?? []).length;
    expect(pages).toBeGreaterThanOrEqual(2);
    expect(pdfFilename(q)).toBe("Quote-PRV-2026-014.pdf");
  }, 30000);

  it("sanitizes unsupported characters", () => {
    expect(sanitizeForPdf("Caffè € – ok 🚀 → fine")).toBe("Caffè € – ok  -> fine");
    expect(sanitizeForPdf(undefined)).toBe("");
  });
});
