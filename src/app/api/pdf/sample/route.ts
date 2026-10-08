import { renderQuotePdf } from "@/lib/pdf/render";
import { getProfession, sampleQuoteFor } from "@/lib/professions";
import { sampleQuote } from "@/lib/quote";

/** A clean example document for the landing and profession pages ("see an example"). */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const lang = params.get("lang") === "en" ? "en" : "it";
  const profession = getProfession(params.get("template") ?? "");
  const quote = profession ? sampleQuoteFor(profession) : sampleQuote(lang);
  const pdf = await renderQuotePdf(quote, { watermark: false });
  const ab = new ArrayBuffer(pdf.byteLength);
  new Uint8Array(ab).set(pdf);
  return new Response(ab, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="esempio-preventivo-${profession ? profession.slug : lang}.pdf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
