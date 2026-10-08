import { z } from "zod";
import type { Quote } from "./types";

const partySchema = z.object({
  name: z.string().max(200),
  vat: z.string().max(40).optional(),
  taxCode: z.string().max(40).optional(),
  address: z.string().max(200).optional(),
  zip: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(40).optional(),
  country: z.string().max(80).optional(),
  email: z.string().max(200).optional(),
  phone: z.string().max(60).optional(),
  pec: z.string().max(200).optional(),
  sdi: z.string().max(20).optional(),
  website: z.string().max(200).optional(),
});

const lineItemSchema = z.object({
  id: z.string().max(64),
  description: z.string().max(500),
  details: z.string().max(2000).optional(),
  quantity: z.number().finite().min(0).max(1_000_000),
  unit: z.string().max(20).optional(),
  unitPrice: z.number().finite().min(-10_000_000).max(10_000_000),
  vatRate: z.number().finite().min(0).max(100),
  discountPct: z.number().finite().min(0).max(100).optional(),
});

const optionsSchema = z.object({
  globalDiscountPct: z.number().finite().min(0).max(100),
  rivalsaInpsPct: z.number().finite().min(0).max(100),
  rivalsaLabel: z.string().max(80).optional(),
  ritenutaAccontoPct: z.number().finite().min(0).max(100),
  regimeForfettario: z.boolean(),
  bollo: z.boolean(),
  depositPct: z.number().finite().min(0).max(100),
  vatExemptNote: z.string().max(500).optional(),
});

const brandingSchema = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  // Data URL only, capped so the request body stays small
  logo: z
    .string()
    .max(700_000)
    .regex(/^data:image\/(png|jpeg|jpg);base64,[A-Za-z0-9+/=]+$/)
    .optional(),
});

export const quoteSchema = z.object({
  id: z.string().min(1).max(64),
  version: z.literal(1),
  number: z.string().max(40),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  validityDays: z.number().int().min(0).max(3650),
  currency: z.string().regex(/^[A-Z]{3}$/),
  lang: z.enum(["it", "en"]),
  subject: z.string().max(300).optional(),
  sender: partySchema,
  client: partySchema,
  items: z.array(lineItemSchema).min(1).max(200),
  notes: z.string().max(5000).optional(),
  paymentTerms: z.string().max(2000).optional(),
  options: optionsSchema,
  branding: brandingSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type QuoteInput = z.input<typeof quoteSchema>;

export function parseQuote(data: unknown): Quote {
  return quoteSchema.parse(data) as Quote;
}

export function safeParseQuote(data: unknown): { ok: true; quote: Quote } | { ok: false; error: string } {
  const r = quoteSchema.safeParse(data);
  if (r.success) return { ok: true, quote: r.data as Quote };
  const first = r.error.issues[0];
  return { ok: false, error: first ? `${first.path.join(".") || "quote"}: ${first.message}` : "Invalid quote" };
}
