import { renderQuotePdf } from "@/lib/pdf/render";
import { sampleQuote } from "@/lib/quote";

/** A clean example document for the landing page ("see an example"). */
export async function GET(req: Request) {
  const lang = new URL(req.url).searchParams.get("lang") === "en" ? "en" : "it";
  const pdf = await renderQuotePdf(sampleQuote(lang), { watermark: false });
  const ab = new ArrayBuffer(pdf.byteLength);
  new Uint8Array(ab).set(pdf);
  return new Response(ab, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="esempio-preventivo-${lang}.pdf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
