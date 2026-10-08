import { NextResponse } from "next/server";
import { escapeHtml, sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/env";
import { jsonError, readJson } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { decide, hashIp, ShareError, toPublic } from "@/lib/share";
import { sharingEnabled } from "@/lib/store";

type Body = { decision?: unknown; name?: unknown; note?: unknown };

/** The client accepts or declines the quote. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!sharingEnabled()) return jsonError("Sharing is not configured", 503, { code: "sharing_disabled" });
  const ip = clientIp(req);
  const rl = rateLimit(`share-decide:${ip}`, 20, 60 * 60 * 1000);
  if (!rl.ok) return jsonError("Too many requests", 429, { code: "rate_limited", retryAfter: rl.retryAfterSec });
  const { id } = await ctx.params;
  const body = await readJson<Body>(req, 10_000);
  const decision = body?.decision === "accepted" || body?.decision === "declined" ? body.decision : null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const note = typeof body?.note === "string" ? body.note : undefined;
  if (!decision) return jsonError("decision must be accepted or declined", 400, { code: "bad_decision" });
  if (name.length < 2 || name.length > 120) return jsonError("Please enter your name", 400, { code: "bad_name" });

  try {
    const rec = await decide(id, { decision, name, note, ipHash: hashIp(ip) });
    if (rec.notifyEmail) {
      const it = rec.quote.lang !== "en";
      const label = decision === "accepted" ? (it ? "accettato" : "accepted") : it ? "rifiutato" : "declined";
      const subject = it ? `Preventivo ${rec.quote.number} ${label} da ${name}` : `Quote ${rec.quote.number} ${label} by ${name}`;
      const link = `${appUrl()}/app?doc=${encodeURIComponent(rec.quote.id)}`;
      const text = it
        ? `${name} ha ${label} il preventivo ${rec.quote.number} (${rec.quote.client.name}).${note ? `\n\nNota: ${note}` : ""}\n\nApri l'app: ${link}`
        : `${name} has ${label} quote ${rec.quote.number} (${rec.quote.client.name}).${note ? `\n\nNote: ${note}` : ""}\n\nOpen the app: ${link}`;
      const html = `<p>${escapeHtml(text).replaceAll("\n", "<br>")}</p>`;
      sendEmail({ to: rec.notifyEmail, subject, text, html }).catch((e) => console.error("[share/decide] email", e));
    }
    return NextResponse.json(toPublic(rec), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof ShareError) return jsonError(err.message, err.code === "not_found" ? 404 : err.code === "already_decided" ? 409 : 503, { code: err.code });
    console.error("[share/decide]", err);
    return jsonError("Store error", 502, { code: "store_error" });
  }
}
