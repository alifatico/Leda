import { newQuote, newLineItem } from "./defaults";
import type { DocLang, Quote } from "./types";

/** A realistic example used on the landing page and for the sample PDF. */
export function sampleQuote(lang: DocLang = "it"): Quote {
  const it = lang === "it";
  return newQuote({
    id: "sample",
    number: "PRV-2026-014",
    date: "2026-10-08",
    createdAt: 1_791_000_000_000,
    updatedAt: 1_791_000_000_000,
    lang,
    subject: it ? "Sito web vetrina e identità visiva" : "Showcase website and visual identity",
    sender: {
      name: "Studio Rossi Design",
      vat: "IT01234567890",
      address: "Via Garibaldi 12",
      zip: "20121",
      city: "Milano",
      province: "MI",
      country: "Italia",
      email: "ciao@studiorossi.it",
      phone: "+39 02 1234567",
      pec: "studiorossi@pec.it",
    },
    client: {
      name: "Trattoria Da Gino S.r.l.",
      vat: "IT09876543210",
      address: "Piazza Duomo 3",
      zip: "20122",
      city: "Milano",
      province: "MI",
      country: "Italia",
      sdi: "M5UXCR1",
    },
    items: [
      newLineItem({
        id: "s1",
        description: it ? "Progettazione e sviluppo sito web (5 pagine)" : "Website design & development (5 pages)",
        details: it
          ? "Design responsive, CMS, ottimizzazione SEO di base, form contatti"
          : "Responsive design, CMS, basic SEO, contact form",
        quantity: 1,
        unit: it ? "a corpo" : "flat",
        unitPrice: 1800,
        vatRate: 22,
      }),
      newLineItem({
        id: "s2",
        description: it ? "Logo e identità visiva" : "Logo and visual identity",
        details: it ? "3 proposte, 2 revisioni, file vettoriali finali" : "3 concepts, 2 revisions, final vector files",
        quantity: 1,
        unit: it ? "a corpo" : "flat",
        unitPrice: 650,
        vatRate: 22,
      }),
      newLineItem({
        id: "s3",
        description: it ? "Manutenzione e hosting" : "Maintenance and hosting",
        quantity: 12,
        unit: it ? "mese" : "month",
        unitPrice: 35,
        vatRate: 22,
      }),
    ],
    notes: it
      ? "Tempi di consegna: 4 settimane dall'approvazione dei contenuti. Il preventivo include 2 round di revisioni."
      : "Delivery: 4 weeks from content approval. The quote includes 2 rounds of revisions.",
    paymentTerms: it
      ? "30% alla conferma, saldo alla consegna. Bonifico bancario a 30 giorni data fattura."
      : "30% on acceptance, balance on delivery. Bank transfer, 30 days from invoice date.",
    options: {
      globalDiscountPct: 0,
      rivalsaInpsPct: 0,
      ritenutaAccontoPct: 0,
      regimeForfettario: false,
      bollo: true,
      depositPct: 30,
    },
    branding: { color: "#1E3A8A" },
  });
}
