import { appUrl } from "@/lib/env";
import { jsonError, readJson } from "@/lib/http";
import { entitles, verifyEntitlement } from "@/lib/license";
import { pdfFilename, renderQuotePdf } from "@/lib/pdf/render";
import { safeParseQuote } from "@/lib/quote";
import { clientIp, rateLimit } from "@/lib/ratelimit";

type Body = { quote?: unknown; unlock?: string; license?: string };

export async function POST(req: Request) {
  const rl = rateLimit(`pdf:${clientIp(req)}`, 120, 60 * 60 * 1000);
  if (!rl.ok) return jsonError("Too many requests", 429, { code: "rate_limited", retryAfter: rl.retryAfterSec });

  const body = await readJson<Body>(req);
  if (!body || typeof body !== "object") return jsonError("Invalid JSON body", 400, { code: "bad_request" });
  const parsed = safeParseQuote(body.quote);
  if (!parsed.ok) return jsonError(parsed.error, 422, { code: "invalid_quote" });
  const quote = parsed.quote;

  let paid = false;
  let failure: string | undefined;
  for (const token of [body.license, body.unlock]) {
    if (!token) continue;
    const r = verifyEntitlement(token);
    if (entitles(r, quote.id)) {
      paid = true;
      break;
    }
    failure = r.ok ? "wrong_document" : r.reason;
  }
  if (!paid && failure) {
    return jsonError("The provided licence does not unlock this document", 402, { code: failure });
  }

  const pdf = await renderQuotePdf(quote, { watermark: !paid, siteUrl: appUrl() });
  const ab = new ArrayBuffer(pdf.byteLength);
  new Uint8Array(ab).set(pdf);
  return new Response(ab, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFilename(quote)}"`,
      "Cache-Control": "no-store",
      "X-Watermark": paid ? "0" : "1",
    },
  });
}
