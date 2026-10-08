import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/http";
import { entitles, verifyEntitlement } from "@/lib/license";
import { safeParseQuote } from "@/lib/quote";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { createOrUpdateShare, ShareError, toOwnerView } from "@/lib/share";
import { sharingEnabled } from "@/lib/store";

type Body = { quote?: unknown; unlock?: string; license?: string; share?: { id?: string; ownerKey?: string } };

/** Create (or refresh) the public link of a paid quote. */
export async function POST(req: Request) {
  if (!sharingEnabled()) return jsonError("Sharing is not configured", 503, { code: "sharing_disabled" });
  const rl = rateLimit(`share:${clientIp(req)}`, 30, 60 * 60 * 1000);
  if (!rl.ok) return jsonError("Too many requests", 429, { code: "rate_limited", retryAfter: rl.retryAfterSec });

  const body = await readJson<Body>(req);
  if (!body || typeof body !== "object") return jsonError("Invalid JSON body", 400, { code: "bad_request" });
  const parsed = safeParseQuote(body.quote);
  if (!parsed.ok) return jsonError(parsed.error, 422, { code: "invalid_quote" });
  const quote = parsed.quote;

  const paid = [body.license, body.unlock].some((tok) => tok && entitles(verifyEntitlement(tok), quote.id));
  if (!paid) return jsonError("Sending to a client requires an unlocked quote or a Pro licence", 402, { code: "payment_required" });

  const existing =
    body.share && typeof body.share.id === "string" && typeof body.share.ownerKey === "string" ? { id: body.share.id, ownerKey: body.share.ownerKey } : undefined;
  try {
    const { record, url } = await createOrUpdateShare({ quote, existing, notifyEmail: quote.sender.email || undefined });
    return NextResponse.json({ id: record.id, ownerKey: record.ownerKey, url, status: toOwnerView(record) }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof ShareError) return jsonError(err.message, 503, { code: err.code });
    console.error("[share]", err);
    return jsonError("Could not create the link", 502, { code: "store_error" });
  }
}
