import { NextResponse } from "next/server";
import { paymentsEnabled } from "@/lib/env";
import { jsonError, readJson } from "@/lib/http";
import { makeProLicense, signEntitlement, verifyEntitlement } from "@/lib/license";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { stripeErrorMessage, subscriptionState } from "@/lib/stripe";

/** Re-issue a Pro licence for the next billing period (called by the app when the old one expires). */
export async function POST(req: Request) {
  const rl = rateLimit(`refresh:${clientIp(req)}`, 30, 60 * 60 * 1000);
  if (!rl.ok) return jsonError("Too many requests", 429, { code: "rate_limited", retryAfter: rl.retryAfterSec });
  if (!paymentsEnabled()) return jsonError("Payments are not configured", 503, { code: "payments_disabled" });

  const body = await readJson<{ license?: string }>(req, 10_000);
  const r = verifyEntitlement(body?.license, Date.now(), undefined, { ignoreExp: true });
  if (!r.ok || r.payload.kind !== "pro") return jsonError("Invalid licence", 400, { code: r.ok ? "not_pro" : r.reason });

  try {
    const state = await subscriptionState(r.payload.sub);
    if (!state.active) return jsonError("Subscription is not active", 402, { code: "inactive", status: state.status });
    const lic = makeProLicense({
      sub: r.payload.sub,
      cus: state.cus,
      email: state.email ?? r.payload.email,
      plan: state.plan,
      periodEndSec: state.periodEndSec,
    });
    return NextResponse.json({ license: signEntitlement(lic), exp: lic.exp, plan: lic.plan }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[license/refresh]", err);
    return jsonError(stripeErrorMessage(err), 502, { code: "stripe_error" });
  }
}
