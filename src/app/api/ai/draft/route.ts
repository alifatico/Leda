import { NextResponse } from "next/server";
import { draftQuote } from "@/lib/ai";
import { aiEnv } from "@/lib/env";
import { jsonError, readJson } from "@/lib/http";
import { newId } from "@/lib/quote";
import { clientIp, rateLimit } from "@/lib/ratelimit";

type Body = { brief?: unknown; lang?: unknown; currency?: unknown; forfettario?: unknown };

const DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT ?? "400", 10) || 400;

export async function POST(req: Request) {
  if (!aiEnv.enabled()) return jsonError("AI drafting is not enabled", 503, { code: "ai_disabled" });
  const perIp = rateLimit(`ai:${clientIp(req)}`, 10, 60 * 60 * 1000);
  if (!perIp.ok) return jsonError("Too many requests", 429, { code: "rate_limited", retryAfter: perIp.retryAfterSec });
  const global = rateLimit("ai:global", DAILY_LIMIT, 24 * 60 * 60 * 1000);
  if (!global.ok) return jsonError("Daily AI quota reached, try again tomorrow", 429, { code: "quota", retryAfter: global.retryAfterSec });

  const body = await readJson<Body>(req, 20_000);
  const brief = typeof body?.brief === "string" ? body.brief.trim() : "";
  if (brief.length < 10 || brief.length > 1500) return jsonError("Describe the job in 10 to 1500 characters", 400, { code: "bad_brief" });
  const lang = body?.lang === "en" ? "en" : "it";
  const currency = typeof body?.currency === "string" && /^[A-Z]{3}$/.test(body.currency) ? body.currency : "EUR";
  const forfettario = body?.forfettario === true;

  const result = await draftQuote({ brief, lang, currency, forfettario });
  if (!result.ok) {
    if (result.reason === "upstream") console.error("[ai/draft]", result.message);
    const status = result.reason === "refusal" ? 422 : result.reason === "disabled" ? 503 : 502;
    return jsonError("Could not draft the quote", status, { code: result.reason });
  }
  const d = result.draft;
  return NextResponse.json({
    subject: d.subject,
    notes: d.notes,
    paymentTerms: d.paymentTerms,
    items: d.items.map((i) => ({
      id: newId(),
      description: i.description,
      details: i.details || undefined,
      quantity: i.quantity,
      unit: i.unit,
      unitPrice: i.unitPrice,
      vatRate: forfettario ? 0 : 22,
      discountPct: 0,
    })),
  });
}
