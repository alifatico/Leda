import { jsonError } from "@/lib/http";
import { pdfFilename, renderQuotePdf } from "@/lib/pdf/render";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { getShare } from "@/lib/share";

/** Clean PDF of a shared (paid) quote, for the client. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const rl = rateLimit(`share-pdf:${clientIp(req)}`, 60, 60 * 60 * 1000);
  if (!rl.ok) return jsonError("Too many requests", 429, { code: "rate_limited", retryAfter: rl.retryAfterSec });
  const { id } = await ctx.params;
  const rec = await getShare(id);
  if (!rec) return jsonError("Not found", 404, { code: "not_found" });
  const pdf = await renderQuotePdf(rec.quote, { watermark: false });
  const ab = new ArrayBuffer(pdf.byteLength);
  new Uint8Array(ab).set(pdf);
  return new Response(ab, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFilename(rec.quote)}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
