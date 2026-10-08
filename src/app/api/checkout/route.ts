import { NextResponse } from "next/server";
import { paymentsEnabled } from "@/lib/env";
import { jsonError, readJson } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { createCheckoutSession, isPlanId, stripeErrorMessage } from "@/lib/stripe";

type Body = { plan?: unknown; docId?: unknown; locale?: unknown };

export async function POST(req: Request) {
  const rl = rateLimit(`checkout:${clientIp(req)}`, 20, 60 * 60 * 1000);
  if (!rl.ok) return jsonError("Too many requests", 429, { code: "rate_limited", retryAfter: rl.retryAfterSec });
  if (!paymentsEnabled()) return jsonError("Payments are not configured yet", 503, { code: "payments_disabled" });

  const body = await readJson<Body>(req, 10_000);
  if (!body || !isPlanId(body.plan)) return jsonError("Unknown plan", 400, { code: "bad_plan" });
  const locale = body.locale === "en" ? "en" : "it";
  const docId = typeof body.docId === "string" && body.docId.length <= 64 ? body.docId : undefined;
  if (body.plan === "single" && !docId) return jsonError("docId is required for a single purchase", 400, { code: "missing_doc" });

  try {
    const { url } = await createCheckoutSession({ plan: body.plan, docId, locale });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[checkout]", err);
    return jsonError(stripeErrorMessage(err), 502, { code: "stripe_error" });
  }
}
