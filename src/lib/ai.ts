import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { aiEnv } from "./env";

/**
 * "Describe the job, get a quote draft": one structured call to Claude.
 * Kept deliberately small and cheap (effort: low, short output).
 */

export const draftSchema = z.object({
  subject: z.string().describe("Short subject line for the quote, max 80 characters"),
  items: z
    .array(
      z.object({
        description: z.string().describe("Line title, max 80 characters"),
        details: z.string().describe("One sentence with what is included; empty string if not needed"),
        quantity: z.number().describe("Quantity, e.g. 1, 8, 12"),
        unit: z.string().describe("Unit of measure in the document language: 'a corpo', 'ore', 'gg', 'mese', 'pz' / 'flat', 'hours', 'days', 'month', 'pcs'"),
        unitPrice: z.number().describe("Unit price excluding VAT, realistic market rate"),
      }),
    )
    .describe("Between 2 and 10 line items"),
  notes: z.string().describe("Notes on timing, deliverables and what is excluded. 1-3 sentences."),
  paymentTerms: z.string().describe("Typical payment terms for this kind of job, 1-2 sentences"),
});

export type Draft = z.infer<typeof draftSchema>;

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  const apiKey = aiEnv.apiKey();
  if (!apiKey) return null;
  if (!client) client = new Anthropic({ apiKey, timeout: 60_000, maxRetries: 1 });
  return client;
}

const SYSTEM: Record<"it" | "en", string> = {
  it: `Aiuti freelance, professionisti e piccole agenzie a preparare preventivi professionali.
Dalla descrizione del lavoro produci una bozza di preventivo: oggetto, voci di costo, note e condizioni di pagamento.
Regole:
- Scrivi in italiano, tono professionale e asciutto.
- Da 2 a 10 voci. Descrizioni brevi (max 80 caratteri), dettagli in una frase.
- Prezzi unitari realistici per il mercato italiano, IVA esclusa, nella valuta indicata. Se l'utente indica prezzi o budget, rispettali.
- Non inventare dati del cliente o del fornitore: non servono.
- Le note dicono cosa è incluso, cosa è escluso e i tempi; le condizioni di pagamento sono quelle tipiche del settore (es. acconto 30% + saldo).`,
  en: `You help freelancers, professionals and small agencies prepare professional quotes.
From the job description produce a quote draft: subject, line items, notes and payment terms.
Rules:
- Write in English, professional and concise.
- Between 2 and 10 line items. Short descriptions (max 80 characters), details in one sentence.
- Realistic unit prices excluding VAT in the given currency. If the user mentions prices or a budget, respect them.
- Never invent client or supplier details: they are not needed.
- Notes state what is included, what is excluded and timing; payment terms are the ones typical for the industry (e.g. 30% deposit + balance).`,
};

export type DraftResult =
  | { ok: true; draft: Draft }
  | { ok: false; reason: "disabled" | "refusal" | "unparseable" | "upstream"; message?: string };

export async function draftQuote(args: {
  brief: string;
  lang: "it" | "en";
  currency: string;
  forfettario: boolean;
}): Promise<DraftResult> {
  const c = getClient();
  if (!c || !aiEnv.enabled()) return { ok: false, reason: "disabled" };

  const userText =
    args.lang === "it"
      ? `Valuta: ${args.currency}. ${args.forfettario ? "Il fornitore è in regime forfettario (prezzi senza IVA)." : ""}\n\nDescrizione del lavoro:\n${args.brief}`
      : `Currency: ${args.currency}. ${args.forfettario ? "The supplier is under the Italian flat-rate scheme (no VAT)." : ""}\n\nJob description:\n${args.brief}`;

  try {
    const res = await c.messages.parse({
      model: aiEnv.model(),
      max_tokens: 4096,
      system: SYSTEM[args.lang],
      messages: [{ role: "user", content: userText }],
      output_config: { effort: "low", format: zodOutputFormat(draftSchema) },
    });
    if (res.stop_reason === "refusal") return { ok: false, reason: "refusal" };
    const draft = res.parsed_output;
    if (!draft) return { ok: false, reason: "unparseable" };
    return { ok: true, draft: tidy(draft) };
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return { ok: false, reason: "upstream", message: `${err.status ?? ""} ${err.message}`.trim() };
    }
    return { ok: false, reason: "upstream", message: err instanceof Error ? err.message : "unknown" };
  }
}

function tidy(d: Draft): Draft {
  const num = (n: number, fallback: number) => (Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : fallback);
  return {
    subject: d.subject.trim().slice(0, 120),
    items: d.items.slice(0, 15).map((i) => ({
      description: i.description.trim().slice(0, 200),
      details: i.details.trim().slice(0, 600),
      quantity: num(i.quantity, 1) || 1,
      unit: i.unit.trim().slice(0, 20),
      unitPrice: num(i.unitPrice, 0),
    })),
    notes: d.notes.trim().slice(0, 2000),
    paymentTerms: d.paymentTerms.trim().slice(0, 1000),
  };
}
