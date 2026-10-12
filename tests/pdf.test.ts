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

  it("prints a clickable site link in the footer of free PDFs, laid out inside the page", async () => {
    const q = sampleQuote("it");
    const pdf = await renderQuotePdf(q, { watermark: true, siteUrl: "https://example.com" });
    dump("footer-link.pdf", pdf);
    const text = Buffer.from(pdf).toString("latin1");
    expect(text).toContain("/URI (https://example.com/?utm_source=pdf&utm_medium=footer)");
    const rect = text.match(/\/Rect \[([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)\]/);
    expect(rect).not.toBeNull();
    const [, , y1, , y2] = rect!;
    expect(Number(y2) - Number(y1)).toBeLessThan(40);
    expect(Number(y2)).toBeLessThan(842);
  }, 30000);

  it("sanitizes unsupported characters", () => {
    expect(sanitizeForPdf("Caffè € – ok 🚀 → fine")).toBe("Caffè € – ok  -> fine");
    expect(sanitizeForPdf(undefined)).toBe("");
  });
});

describe("PDF styles and editable template", () => {
  it("renders every style, with cover, intro, closing, hidden columns and custom labels", async () => {
    const { STYLE_IDS } = await import("@/lib/quote");
    for (const style of STYLE_IDS) {
      const q = sampleQuote("it");
      q.options = { ...q.options, rivalsaInpsPct: 4, ritenutaAccontoPct: 20, depositPct: 30 };
      q.design = {
        style,
        columns: { qty: style !== "compatto", unitPrice: true, vat: style !== "essenziale" },
        labels: { title: "OFFERTA", to: "Preparato per", netPayable: "Da pagare" },
        intro: "Gentile Sig. Gino,\ncome concordato le invio la nostra proposta per il nuovo sito e l'identità visiva.",
        closing: "Coordinate bancarie: IT60 X054 2811 1010 0000 0123 456 intestato a Studio Rossi Design.",
        cover: { enabled: style === "moderno" || style === "elegante" || style === "studio", title: "Sito web e identità visiva", subtitle: "Proposta per Trattoria Da Gino" },
        showSignature: style !== "compatto",
      };
      const pdf = await renderQuotePdf(q, { watermark: style === "classico", siteUrl: "https://example.com" });
      dump(`style-${style}.pdf`, pdf);
      const text = Buffer.from(pdf).toString("latin1");
      const pages = (text.match(/\/Type \/Page[^s]/g) ?? []).length;
      expect(text.slice(0, 5)).toBe("%PDF-");
      expect(pages).toBeGreaterThanOrEqual(q.design.cover?.enabled ? 2 : 1);
      expect(pages).toBeLessThanOrEqual(3);
    }
  }, 60000);
});

describe("PDF edge cases", () => {
  // A 1×1 red PNG: enough to exercise the logo paths (white card on colour, no monogram)
  const LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

  it("renders every style with a logo, a light brand colour, no subject and no withholding", async () => {
    const { STYLE_IDS } = await import("@/lib/quote");
    for (const style of STYLE_IDS) {
      const q = sampleQuote("en");
      q.subject = undefined;
      q.branding = { color: "#FACC15", logo: LOGO };
      q.design = { style, cover: { enabled: true, title: "", subtitle: "" } };
      const pdf = await renderQuotePdf(q, { watermark: false });
      dump(`edge-${style}.pdf`, pdf);
      const text = Buffer.from(pdf).toString("latin1");
      expect(text.slice(0, 5)).toBe("%PDF-");
      expect((text.match(/\/Type \/Page[^s]/g) ?? []).length).toBe(2);
    }
  }, 60000);

  it("embeds the document typefaces instead of the built-in Helvetica", async () => {
    const q = sampleQuote("it");
    q.design = { style: "elegante" };
    const pdf = await renderQuotePdf(q, { watermark: false });
    const text = Buffer.from(pdf).toString("latin1");
    expect(text).toContain("Lora");
    expect(text).toContain("PlayfairDisplay");
    expect(text).not.toContain("/BaseFont /Helvetica");
  }, 30000);
});
