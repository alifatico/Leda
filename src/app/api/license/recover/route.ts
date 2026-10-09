import { BRAND } from "@/lib/brand";
import { NextResponse } from "next/server";
import { escapeHtml, sendEmail } from "@/lib/email";
import { appUrl, businessEnv, emailEnv, paymentsEnabled } from "@/lib/env";
import { jsonError, readJson } from "@/lib/http";
import { makeProLicense, signEntitlement } from "@/lib/license";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { findActiveSubscriptionByEmail } from "@/lib/stripe";

/**
 * "I lost my licence key": we look the e-mail up in Stripe and, if there is an
 * active subscription, e-mail a fresh key. The response is identical whether
 * or not a subscription exists, so addresses cannot be enumerated.
 */
export async function POST(req: Request) {
  const rl = rateLimit(`recover:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!rl.ok) return jsonError("Too many requests", 429, { code: "rate_limited", retryAfter: rl.retryAfterSec });
  if (!paymentsEnabled()) return jsonError("Payments are not configured", 503, { code: "payments_disabled" });
  if (!emailEnv.resendApiKey()) {
    return jsonError("Licence recovery by e-mail is not configured", 503, {
      code: "recovery_unavailable",
      supportEmail: businessEnv.supportEmail(),
    });
  }

  const body = await readJson<{ email?: string; locale?: string }>(req, 5_000);
  const email = (body?.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return jsonError("Invalid e-mail", 400, { code: "bad_email" });
  const it = body?.locale !== "en";

  try {
    const found = await findActiveSubscriptionByEmail(email);
    if (found) {
      const lic = makeProLicense({ sub: found.sub, cus: found.cus, email, plan: found.plan, periodEndSec: found.periodEndSec });
      const token = signEntitlement(lic);
      const link = `${appUrl()}/app?license=${encodeURIComponent(token)}`;
      const subject = it ? `La tua chiave ${BRAND} Pro` : `Your ${BRAND} Pro key`;
      const text = it
        ? `Ecco la tua chiave di licenza Pro:\n\n${token}\n\nApri questo link per attivarla automaticamente:\n${link}\n`
        : `Here is your Pro licence key:\n\n${token}\n\nOpen this link to activate it automatically:\n${link}\n`;
      const html = `<p>${it ? "Ecco la tua chiave di licenza Pro:" : "Here is your Pro licence key:"}</p>
<p style="font-family:monospace;word-break:break-all;background:#f3f4f6;padding:12px;border-radius:6px">${escapeHtml(token)}</p>
<p><a href="${escapeHtml(link)}">${it ? "Attiva la licenza con un clic" : "Activate the licence with one click"}</a></p>`;
      await sendEmail({ to: email, subject, text, html });
    }
  } catch (err) {
    console.error("[license/recover]", err);
    return jsonError("Could not process the request right now", 502, { code: "upstream_error" });
  }
  return NextResponse.json({ ok: true });
}
