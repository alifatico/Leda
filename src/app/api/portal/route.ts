import { NextResponse } from "next/server";
import { paymentsEnabled } from "@/lib/env";
import { jsonError, readJson } from "@/lib/http";
import { verifyEntitlement } from "@/lib/license";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { createPortalSession, stripeErrorMessage } from "@/lib/stripe";

/** Stripe Customer Portal: update card, download invoices, cancel. */
export async function POST(req: Request) {
  const rl = rateLimit(`portal:${clientIp(req)}`, 20, 60 * 60 * 1000);
  if (!rl.ok) return jsonError("Too many requests", 429, { code: "rate_limited", retryAfter: rl.retryAfterSec });
  if (!paymentsEnabled()) return jsonError("Payments are not configured", 503, { code: "payments_disabled" });

  const body = await readJson<{ license?: string }>(req, 10_000);
  const r = verifyEntitlement(body?.license, Date.now(), undefined, { ignoreExp: true });
  if (!r.ok || r.payload.kind !== "pro") return jsonError("Invalid licence", 400, { code: r.ok ? "not_pro" : r.reason });
  try {
    const url = await createPortalSession(r.payload.cus);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[portal]", err);
    return jsonError(stripeErrorMessage(err), 502, { code: "stripe_error" });
  }
}
