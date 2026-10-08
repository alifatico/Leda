import { NextResponse } from "next/server";
import { paymentsEnabled } from "@/lib/env";
import { jsonError } from "@/lib/http";
import { makeProLicense, makeSingleUnlock, signEntitlement } from "@/lib/license";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { stripeErrorMessage, verifyCheckoutSession } from "@/lib/stripe";

export async function GET(req: Request) {
  const rl = rateLimit(`verify:${clientIp(req)}`, 40, 60 * 60 * 1000);
  if (!rl.ok) return jsonError("Too many requests", 429, { code: "rate_limited", retryAfter: rl.retryAfterSec });
  if (!paymentsEnabled()) return jsonError("Payments are not configured", 503, { code: "payments_disabled" });

  const sessionId = new URL(req.url).searchParams.get("session_id") ?? "";
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return jsonError("Invalid session id", 400, { code: "bad_session" });

  try {
    const v = await verifyCheckoutSession(sessionId);
    if (!v.paid) return jsonError("Payment not completed", 402, { code: "unpaid", status: v.status });
    if (v.kind === "single") {
      const unlock = signEntitlement(makeSingleUnlock(v.docId, v.sessionId));
      return NextResponse.json({ kind: "single", docId: v.docId, unlock, email: v.email ?? null }, { headers: { "Cache-Control": "no-store" } });
    }
    const lic = makeProLicense({ sub: v.sub, cus: v.cus, email: v.email, plan: v.plan, periodEndSec: v.periodEndSec });
    const license = signEntitlement(lic);
    return NextResponse.json(
      { kind: "pro", license, email: v.email ?? null, plan: v.plan, exp: lic.exp },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[verify]", err);
    return jsonError(stripeErrorMessage(err), 502, { code: "stripe_error" });
  }
}
