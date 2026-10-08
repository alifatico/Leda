/**
 * Core domain types for a quote ("preventivo").
 * Everything here is plain JSON so it can live in localStorage, travel to the
 * PDF endpoint and be hashed/signed without any server-side database.
 */

export type DocLang = "it" | "en";

export type Party = {
  name: string;
  /** Partita IVA / VAT number */
  vat?: string;
  /** Codice fiscale / tax code */
  taxCode?: string;
  address?: string;
  zip?: string;
  city?: string;
  province?: string;
  country?: string;
  email?: string;
  phone?: string;
  /** PEC (certified e-mail) — Italian businesses */
  pec?: string;
  /** Codice destinatario SDI — Italian e-invoicing */
  sdi?: string;
  website?: string;
};

export type LineItem = {
  id: string;
  description: string;
  /** Optional longer description printed under the title */
  details?: string;
  quantity: number;
  /** e.g. "ore", "pz", "gg", "mese" */
  unit?: string;
  unitPrice: number;
  /** VAT rate in percent, e.g. 22 */
  vatRate: number;
  /** Line discount in percent */
  discountPct?: number;
};

export type QuoteOptions = {
  /** Discount applied on the whole quote, in percent */
  globalDiscountPct: number;
  /** "Rivalsa INPS" (gestione separata): usually 0 or 4 */
  rivalsaInpsPct: number;
  /** Custom wording for the 4% surcharge, e.g. "Contributo integrativo Inarcassa 4%" */
  rivalsaLabel?: string;
  /** "Ritenuta d'acconto": usually 0 or 20 */
  ritenutaAccontoPct: number;
  /** Flat-rate scheme (regime forfettario): no VAT, no withholding, legal wording */
  regimeForfettario: boolean;
  /** Charge the €2.00 "imposta di bollo" when the VAT-exempt amount exceeds €77.47 */
  bollo: boolean;
  /** Deposit requested on acceptance, in percent of the amount due */
  depositPct: number;
  /** Custom wording shown when some lines are VAT exempt */
  vatExemptNote?: string;
};

export type Branding = {
  /** Accent colour used in the PDF, hex */
  color: string;
  /** Logo as data URL (PNG/JPEG), optional */
  logo?: string;
};

export type Quote = {
  id: string;
  version: 1;
  number: string;
  /** ISO date yyyy-mm-dd */
  date: string;
  validityDays: number;
  /** ISO-4217 currency code */
  currency: string;
  lang: DocLang;
  /** Short subject line printed under the title, e.g. "Sito web vetrina" */
  subject?: string;
  sender: Party;
  client: Party;
  items: LineItem[];
  notes?: string;
  paymentTerms?: string;
  options: QuoteOptions;
  branding: Branding;
  createdAt: number;
  updatedAt: number;
};

export type VatGroup = { rate: number; base: number; vat: number };

export type LineTotals = {
  id: string;
  /** quantity × unit price, before any discount */
  gross: number;
  /** after the line discount */
  net: number;
  /** after the global discount (proportional) */
  netAfterGlobal: number;
  rivalsa: number;
  vatRate: number;
  vatBase: number;
  vat: number;
};

export type Totals = {
  lines: LineTotals[];
  /** Sum of gross line amounts */
  subtotal: number;
  lineDiscounts: number;
  globalDiscount: number;
  /** Net amount of services/goods after all discounts */
  net: number;
  rivalsa: number;
  /** net + rivalsa: the base on which VAT is computed */
  taxable: number;
  vatGroups: VatGroup[];
  vatTotal: number;
  bollo: number;
  /** taxable + VAT + bollo: the invoice total */
  total: number;
  ritenuta: number;
  /** total − ritenuta: what the client actually pays */
  netPayable: number;
  deposit: number;
};
