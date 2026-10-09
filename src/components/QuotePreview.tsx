"use client";

import React from "react";
import {
  addressLines,
  computeTotals,
  formatDate,
  formatMoney,
  formatNumber,
  formatPct,
  labelsFor,
  rivalsaCaption,
  validUntil,
  type Party,
  type Quote,
} from "@/lib/quote";

/** HTML twin of the PDF layout, used for the live preview and the landing hero. */
export function QuotePreview({ quote, watermark = false, className = "" }: { quote: Quote; watermark?: boolean; className?: string }) {
  const L = labelsFor(quote.lang);
  const t = computeTotals(quote);
  const color = /^#[0-9a-fA-F]{6}$/.test(quote.branding.color) ? quote.branding.color : "#1E3A8A";
  const money = (n: number) => formatMoney(n, quote.currency, quote.lang);
  const showDisc = quote.items.some((i) => (i.discountPct ?? 0) > 0);
  const hasExempt = t.vatGroups.some((g) => g.rate === 0);
  const occasionale = !quote.options.regimeForfettario && Boolean(quote.options.prestazioneOccasionale);

  return (
    <div className={"relative overflow-hidden bg-white text-[11px] leading-snug text-slate-900 " + className} style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      {watermark ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="-rotate-30 select-none text-7xl font-bold tracking-[0.3em] text-slate-200/80">{L.preview}</span>
        </div>
      ) : null}
      <div className="relative p-8 sm:p-10">
        {/* header */}
        <div className="flex items-start justify-between gap-6">
          <div className="max-w-[55%]">
            {quote.branding.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={quote.branding.logo} alt="" className="max-h-14 max-w-[160px] object-contain" />
            ) : (
              <div className="text-lg font-bold" style={{ color }}>
                {quote.sender.name || L.quote}
              </div>
            )}
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

        {/* parties */}
        <div className="mt-7 grid grid-cols-2 gap-4">
          <PartyBlock party={quote.sender} label={L.from} lang={quote.lang} />
          <PartyBlock party={quote.client} label={L.to} lang={quote.lang} boxed />
        </div>

        {quote.subject ? (
          <div className="mt-4">
            <span className="text-slate-600">{L.subject}: </span>
            <span className="font-bold">{quote.subject}</span>
          </div>
        ) : null}

        {/* table */}
        <table className="mt-4 w-full border-collapse">
          <thead>
            <tr className="text-left text-[9.5px] font-bold text-white" style={{ backgroundColor: color }}>
              <th className="rounded-l px-2 py-1.5">{L.description}</th>
              <th className="px-2 py-1.5 text-right">{L.qty}</th>
              <th className="px-2 py-1.5 text-right">{L.unitPrice}</th>
              {showDisc ? <th className="px-2 py-1.5 text-right">{L.discount}</th> : null}
              <th className="px-2 py-1.5 text-right">{L.vatRate}</th>
              <th className="rounded-r px-2 py-1.5 text-right">{L.amount}</th>
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
                  <td className="border-b border-slate-200 px-2 py-1.5 text-right align-top whitespace-nowrap">
                    {formatNumber(it.quantity, quote.lang, 3)}
                    {it.unit ? ` ${it.unit}` : ""}
                  </td>
                  <td className="border-b border-slate-200 px-2 py-1.5 text-right align-top whitespace-nowrap">{money(it.unitPrice)}</td>
                  {showDisc ? (
                    <td className="border-b border-slate-200 px-2 py-1.5 text-right align-top">{it.discountPct ? formatPct(it.discountPct, quote.lang) : "—"}</td>
                  ) : null}
                  <td className="border-b border-slate-200 px-2 py-1.5 text-right align-top">{formatNumber(lt.vatRate, quote.lang)}%</td>
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
                <div className="mt-1 flex justify-between rounded px-2 py-2 text-[13px] font-bold text-white" style={{ backgroundColor: color }}>
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

        <div className="mt-8 flex items-end justify-between">
          <div className="text-[9px] text-slate-600">
            {L.validUntil} {formatDate(validUntil(quote), quote.lang)}
          </div>
          <div className="w-[230px] border-t border-slate-900 pt-1 text-[9px] text-slate-600">
            <div className="font-bold text-slate-900">{L.acceptance}</div>
            <div>{L.signature}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-end gap-2">
      <span className="text-slate-600">{label}</span>
      <span className="min-w-[96px] font-bold">{value}</span>
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

function PartyBlock({ party, label, lang, boxed }: { party: Party; label: string; lang: Quote["lang"]; boxed?: boolean }) {
  const L = labelsFor(lang);
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
    <div className={boxed ? "rounded bg-slate-50 p-3" : ""}>
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
