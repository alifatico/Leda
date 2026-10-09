"use client";

import React from "react";
import {
  addressLines,
  computeTotals,
  formatDate,
  formatMoney,
  formatNumber,
  formatPct,
  resolveDesign,
  rivalsaCaption,
  validUntil,
  type DocLabels,
  type Party,
  type Quote,
} from "@/lib/quote";

const HTML_FONTS = {
  helvetica: "Helvetica, Arial, sans-serif",
  times: "'Times New Roman', Times, Georgia, serif",
  courier: "'Courier New', Courier, monospace",
} as const;

/** HTML twin of the PDF layout, used for the live preview and the landing hero. */
export function QuotePreview({ quote, watermark = false, className = "" }: { quote: Quote; watermark?: boolean; className?: string }) {
  const d = resolveDesign(quote);
  const L = d.labels;
  const t = computeTotals(quote);
  const color = /^#[0-9a-fA-F]{6}$/.test(quote.branding.color) ? quote.branding.color : "#1E3A8A";
  const money = (n: number) => formatMoney(n, quote.currency, quote.lang);
  const showDisc = quote.items.some((i) => (i.discountPct ?? 0) > 0);
  const hasExempt = t.vatGroups.some((g) => g.rate === 0);
  const occasionale = !quote.options.regimeForfettario && Boolean(quote.options.prestazioneOccasionale);
  const cols = d.columns;
  const fontFamily = HTML_FONTS[d.tokens.font];
  const fontSize = d.tokens.fontSize === 8.5 ? 10 : d.tokens.fontSize === 10 ? 11.5 : 11;
  const rounded = d.tokens.rounded ? "rounded" : "";
  const filledTh = d.tokens.tableHeader === "filled";
  const senderName = quote.sender.name;
  const senderContact = [quote.sender.name, ...addressLines(quote.sender), quote.sender.email, quote.sender.phone].filter(Boolean).join(" · ");

  const watermarkEl = watermark ? (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="-rotate-30 select-none text-7xl font-bold tracking-[0.3em] text-slate-200/80">{L.preview}</span>
    </div>
  ) : null;

  return (
    <div className={"bg-white text-slate-900 " + className} style={{ fontFamily, fontSize, lineHeight: 1.35 }}>
      {d.cover ? (
        <div className="relative overflow-hidden border-b-8 border-slate-100" style={{ minHeight: 560 }}>
          {watermarkEl}
          <div className="px-8 pb-10 pt-10 sm:px-10" style={{ backgroundColor: color, minHeight: 120 }}>
            {quote.branding.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={quote.branding.logo} alt="" className="max-h-14 max-w-[170px] object-contain" />
            ) : senderName ? (
              <div className="text-xl font-bold text-white">{senderName}</div>
            ) : null}
          </div>
          <div className="relative px-8 pt-12 sm:px-10">
            <div className="text-[10px] uppercase tracking-[0.15em] text-slate-600">
              {L.quote} {quote.number}
            </div>
            <div className="mt-2 text-3xl font-bold leading-tight" style={{ color }}>
              {d.cover.title || quote.subject || L.quote}
            </div>
            {d.cover.subtitle ? <div className="mt-2 text-base text-slate-600">{d.cover.subtitle}</div> : null}
            {d.cover.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.cover.image} alt="" className="mt-6 max-h-56 w-full object-contain" />
            ) : null}
            <div className="mt-8 space-y-0.5 border-t border-slate-200 pt-3">
              <CoverMeta label={L.to} value={quote.client.name || "—"} />
              <CoverMeta label={L.date} value={formatDate(quote.date, quote.lang)} />
              <CoverMeta label={L.validUntil} value={formatDate(validUntil(quote), quote.lang)} />
            </div>
            <div className="mt-10 pb-6 text-[9px] text-slate-400">{senderContact}</div>
          </div>
        </div>
      ) : null}

      <div className="relative overflow-hidden">
        {watermarkEl}
        <div className="relative p-8 sm:p-10">
          {/* header */}
          {d.tokens.header === "band" ? (
            <div className={"flex items-start justify-between gap-6 p-4 text-white " + rounded} style={{ backgroundColor: color }}>
              <div className="max-w-[55%]">
                {quote.branding.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={quote.branding.logo} alt="" className="max-h-14 max-w-[160px] object-contain" />
                ) : senderName ? (
                  <div className="text-lg font-bold">{senderName}</div>
                ) : null}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold tracking-widest">{L.quote}</div>
                <div className="mt-2 space-y-0.5 text-[10.5px]">
                  <Meta label={L.number} value={quote.number} light />
                  <Meta label={L.date} value={formatDate(quote.date, quote.lang)} light />
                  <Meta label={L.validUntil} value={formatDate(validUntil(quote), quote.lang)} light />
                </div>
              </div>
            </div>
          ) : d.tokens.header === "centered" ? (
            <div className="flex flex-col items-center text-center">
              {quote.branding.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={quote.branding.logo} alt="" className="max-h-14 max-w-[160px] object-contain" />
              ) : senderName ? (
                <div className="text-lg font-bold" style={{ color }}>
                  {senderName}
                </div>
              ) : null}
              <div className="mt-2 text-3xl font-bold tracking-[0.2em]" style={{ color }}>
                {L.quote}
              </div>
              <div className="my-2 h-[2px] w-20" style={{ backgroundColor: color }} />
              <div className="text-slate-600">
                {L.number} <b className="text-slate-900">{quote.number}</b> · {L.date} <b className="text-slate-900">{formatDate(quote.date, quote.lang)}</b> · {L.validUntil}{" "}
                <b className="text-slate-900">{formatDate(validUntil(quote), quote.lang)}</b>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-6">
              <div className="max-w-[55%]">
                {quote.branding.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={quote.branding.logo} alt="" className="max-h-14 max-w-[160px] object-contain" />
                ) : senderName ? (
                  <div className="text-lg font-bold" style={{ color }}>
                    {senderName}
                  </div>
                ) : null}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold tracking-widest" style={{ color }}>
                  {L.quote}
                </div>
                <div className="mt-2 space-y-0.5 text-[10.5px]">
                  <Meta label={L.number} value={quote.number} />
                  <Meta label={L.date} value={formatDate(quote.date, quote.lang)} />
                  <Meta label={L.validUntil} value={formatDate(validUntil(quote), quote.lang)} />
                </div>
              </div>
            </div>
          )}

          {/* parties */}
          <div className="mt-7 grid grid-cols-2 gap-4">
            <PartyBlock party={quote.sender} label={L.from} L={L} />
            <PartyBlock party={quote.client} label={L.to} L={L} boxed={d.tokens.partyBox} rounded={d.tokens.rounded} />
          </div>

          {quote.subject ? (
            <div className="mt-4">
              <span className="text-slate-600">{L.subject}: </span>
              <span className="font-bold">{quote.subject}</span>
            </div>
          ) : null}

          {d.intro ? <p className="mt-4 whitespace-pre-line">{d.intro}</p> : null}

          {/* table */}
          <table className="mt-4 w-full border-collapse">
            <thead>
              <tr
                className={"text-left text-[9.5px] font-bold " + (filledTh ? "text-white" : "")}
                style={filledTh ? { backgroundColor: color } : { color, borderBottom: `2px solid ${color}` }}
              >
                <th className={(filledTh && d.tokens.rounded ? "rounded-l " : "") + "px-2 py-1.5"}>{L.description}</th>
                {cols.qty ? <th className="px-2 py-1.5 text-right">{L.qty}</th> : null}
                {cols.unitPrice ? <th className="px-2 py-1.5 text-right">{L.unitPrice}</th> : null}
                {showDisc ? <th className="px-2 py-1.5 text-right">{L.discount}</th> : null}
                {cols.vat ? <th className="px-2 py-1.5 text-right">{L.vatRate}</th> : null}
                <th className={(filledTh && d.tokens.rounded ? "rounded-r " : "") + "px-2 py-1.5 text-right"}>{L.amount}</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((it, idx) => {
                const lt = t.lines[idx];
                return (
                  <tr key={it.id} className={idx % 2 === 1 ? "bg-slate-50" : ""}>
                    <td className="border-b border-slate-200 px-2 py-1.5 align-top">
                      <div className="font-bold">{it.description || "—"}</div>
                      {it.details ? <div className="text-[9.5px] text-slate-600">{it.details}</div> : null}
                    </td>
                    {cols.qty ? (
                      <td className="border-b border-slate-200 px-2 py-1.5 text-right align-top whitespace-nowrap">
                        {formatNumber(it.quantity, quote.lang, 3)}
                        {it.unit ? ` ${it.unit}` : ""}
                      </td>
                    ) : null}
                    {cols.unitPrice ? <td className="border-b border-slate-200 px-2 py-1.5 text-right align-top whitespace-nowrap">{money(it.unitPrice)}</td> : null}
                    {showDisc ? (
                      <td className="border-b border-slate-200 px-2 py-1.5 text-right align-top">{it.discountPct ? formatPct(it.discountPct, quote.lang) : "—"}</td>
                    ) : null}
                    {cols.vat ? <td className="border-b border-slate-200 px-2 py-1.5 text-right align-top">{formatNumber(lt.vatRate, quote.lang)}%</td> : null}
                    <td className="border-b border-slate-200 px-2 py-1.5 text-right align-top whitespace-nowrap">{money(lt.net)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* totals */}
          <div className="mt-3 flex justify-end">
            <div className="w-[270px] space-y-0.5">
              {t.lineDiscounts > 0 || t.globalDiscount > 0 ? <Line label={L.subtotal} value={money(t.subtotal)} /> : null}
              {t.lineDiscounts > 0 ? <Line label={L.lineDiscounts} value={`-${money(t.lineDiscounts)}`} /> : null}
              {t.globalDiscount > 0 ? (
                <Line label={`${L.globalDiscount} ${formatPct(quote.options.globalDiscountPct, quote.lang)}`} value={`-${money(t.globalDiscount)}`} />
              ) : null}
              <Line label={L.net} value={money(t.net)} />
              {t.rivalsa > 0 ? (
                <>
                  <Line label={rivalsaCaption(quote.options, quote.lang)} value={money(t.rivalsa)} />
                  <Line label={L.taxable} value={money(t.taxable)} />
                </>
              ) : null}
              {t.vatGroups.map((g) => (
                <Line key={g.rate} label={`${L.vatOn} ${formatNumber(g.rate, quote.lang)}%${t.vatGroups.length > 1 ? ` (${money(g.base)})` : ""}`} value={money(g.vat)} />
              ))}
              {t.bollo > 0 ? <Line label={L.bollo} value={money(t.bollo)} /> : null}
              <div className="mt-1 flex justify-between border-t border-slate-200 px-1.5 py-1.5 text-[13px] font-bold">
                <span>{L.total}</span>
                <span>{money(t.total)}</span>
              </div>
              {t.ritenuta > 0 ? (
                <>
                  <Line label={`${L.ritenuta} ${formatPct(quote.options.ritenutaAccontoPct, quote.lang)}`} value={`-${money(t.ritenuta)}`} />
                  <div
                    className={"mt-1 flex justify-between px-2 py-2 text-[13px] font-bold " + rounded}
                    style={d.tokens.totalsHighlight === "filled" ? { backgroundColor: color, color: "#fff" } : { border: `2px solid ${color}`, color }}
                  >
                    <span>{L.netPayable}</span>
                    <span>{money(t.netPayable)}</span>
                  </div>
                </>
              ) : null}
              {t.deposit > 0 ? <Line label={`${L.deposit} (${formatPct(quote.options.depositPct, quote.lang)})`} value={money(t.deposit)} /> : null}
            </div>
          </div>

          {quote.notes || quote.paymentTerms ? (
            <div className="mt-6 grid grid-cols-2 gap-5">
              {quote.notes ? <Section title={L.notes} body={quote.notes} /> : null}
              {quote.paymentTerms ? <Section title={L.paymentTerms} body={quote.paymentTerms} /> : null}
            </div>
          ) : null}

          {quote.options.regimeForfettario || occasionale || hasExempt || t.bollo > 0 ? (
            <div className="mt-4 space-y-0.5 text-[9px] text-slate-600">
              {quote.options.regimeForfettario ? <p>{L.forfettarioNote}</p> : null}
              {occasionale ? (
                <p>
                  {L.occasionaleNote}
                  {t.ritenuta > 0 ? ` ${L.occasionaleRitenutaNote}` : ""}
                </p>
              ) : null}
              {hasExempt && !quote.options.regimeForfettario && !occasionale ? <p>{quote.options.vatExemptNote || L.exemptNote}</p> : null}
              {t.bollo > 0 ? <p>{L.bolloNote}</p> : null}
            </div>
          ) : null}

          {d.closing ? <p className="mt-4 whitespace-pre-line border-t border-slate-200 pt-3">{d.closing}</p> : null}

          {d.showSignature || d.showValidity ? (
            <div className="mt-8 flex items-end justify-between">
              <div className="text-[9px] text-slate-600">{d.showValidity ? `${L.validUntil} ${formatDate(validUntil(quote), quote.lang)}` : ""}</div>
              {d.showSignature ? (
                <div className="w-[230px] border-t border-slate-900 pt-1 text-[9px] text-slate-600">
                  <div className="font-bold text-slate-900">{L.acceptance}</div>
                  <div>{L.signature}</div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value, light }: { label: string; value: string; light?: boolean }) {
  return (
    <div className="flex justify-end gap-2">
      <span className={light ? "text-white/80" : "text-slate-600"}>{label}</span>
      <span className="min-w-[96px] font-bold">{value}</span>
    </div>
  );
}

function CoverMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-28 shrink-0 text-slate-600">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-1.5 py-0.5">
      <span className="text-slate-600">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="mb-1 text-[8.5px] font-bold uppercase tracking-wider text-slate-600">{title}</div>
      <div className="whitespace-pre-line">{body}</div>
    </div>
  );
}

function PartyBlock({ party, label, L, boxed, rounded }: { party: Party; label: string; L: DocLabels; boxed?: boolean; rounded?: boolean }) {
  const rows: string[] = [
    ...addressLines(party),
    party.vat ? `${L.vat} ${party.vat}` : "",
    party.taxCode ? `${L.taxCode} ${party.taxCode}` : "",
    party.email ?? "",
    party.phone ? `${L.phone} ${party.phone}` : "",
    party.pec ? `${L.pec} ${party.pec}` : "",
    party.sdi ? `${L.sdi} ${party.sdi}` : "",
    party.website ?? "",
  ].filter(Boolean);
  return (
    <div className={boxed ? "bg-slate-50 p-3 " + (rounded ? "rounded" : "") : ""}>
      <div className="mb-1 text-[8.5px] uppercase tracking-wider text-slate-600">{label}</div>
      <div className="text-[12px] font-bold">{party.name || "—"}</div>
      {rows.map((r, i) => (
        <div key={i} className="text-slate-600">
          {r}
        </div>
      ))}
    </div>
  );
}

