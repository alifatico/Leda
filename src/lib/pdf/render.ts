import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { Quote } from "@/lib/quote";
import { QuoteDocument } from "./QuoteDocument";

export async function renderQuotePdf(quote: Quote, opts: { watermark: boolean; siteUrl?: string }): Promise<Uint8Array> {
  const element = React.createElement(QuoteDocument, { quote, watermark: opts.watermark, siteUrl: opts.siteUrl });
  // renderToBuffer expects a <Document/> element
  const buf = await renderToBuffer(element as unknown as React.ReactElement<import("@react-pdf/renderer").DocumentProps>);
  return buf;
}

export function pdfFilename(quote: Quote): string {
  const safe = (quote.number || "preventivo").replace(/[^A-Za-z0-9_-]+/g, "-");
  return `${quote.lang === "en" ? "Quote" : "Preventivo"}-${safe}.pdf`;
}
