"use client";

import React, { type CSSProperties } from "react";
import { DOC_FONT_FAMILY } from "@/lib/fonts";
import {
  addressLines,
  computeTotals,
  formatDate,
  formatMoney,
  formatNumber,
  formatPct,
  headlineAmount,
  itemIndex,
  monogram,
  resolveDesign,
  rivalsaCaption,
  validUntil,
  type DocLabels,
  type Palette,
  type Party,
  type Quote,
  type ResolvedDesign,
  type Totals,
} from "@/lib/quote";
import { cx } from "./ui";

/**
 * Shared state of one preview, handed to the blocks below so the HTML twin
 * follows the same structure as `src/lib/pdf/QuoteDocument.tsx`.
 */
type Ctx = {
  quote: Quote;
  d: ResolvedDesign;
  L: DocLabels;
  P: Palette;
  t: Totals;
  money: (n: number) => string;
  /** Points of the PDF to pixels of the preview */
  px: (pt: number) => number;
  body: string;
  display: string;
  /** Italic exists only for the serif families of the masthead layout */
  italic: string;
  radius: string;
  labelColor: string;
  senderName: string;
  title: string;
};

function Label({ c, children, className }: { c: Ctx; children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("font-semibold uppercase tracking-[0.09em]", className)} style={{ fontSize: c.px(c.d.tokens.fontSize - 2.5), color: c.labelColor }}>
      {children}
    </div>
  );
}

function partyRows(party: Party, L: DocLabels): string[] {
  return [
    ...addressLines(party),
    party.vat ? `${L.vat} ${party.vat}` : "",
    party.taxCode ? `${L.taxCode} ${party.taxCode}` : "",
    party.email ?? "",
    party.phone ? `${L.phone} ${party.phone}` : "",
    party.pec ? `${L.pec} ${party.pec}` : "",
    party.sdi ? `${L.sdi} ${party.sdi}` : "",
    party.website ?? "",
  ].filter(Boolean);
}

function PartyBlock({ c, party, label, card }: { c: Ctx; party: Party; label: string; card?: boolean }) {
  const { P, L, px, d } = c;
  const style: CSSProperties = card
    ? { backgroundColor: P.tint, borderRadius: c.radius, borderLeft: d.tokens.layout === "letterhead" ? `4px solid ${P.accent}` : undefined }
    : {};
  return (
    <div className={card ? "p-3" : ""} style={style}>
      <Label c={c}>{label}</Label>
      <div className="mt-0.5 font-semibold" style={{ fontSize: px(d.tokens.fontSize + 1.5) }}>
        {party.name || "—"}
      </div>
      {partyRows(party, L).map((r, i) => (
        <div key={i} style={{ color: P.muted }}>
          {r}
        </div>
      ))}
    </div>
  );
}

/** The sender's mark: the logo, or the initials in a badge when the style asks for one, or just the name. */
function Brand({ c, onAccent, className, style }: { c: Ctx; onAccent: boolean; className?: string; style?: CSSProperties }) {
  const { quote, d, P, senderName } = c;
  const logo = quote.branding.logo;
  if (logo) {
    const img = (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo} alt="" className="max-h-14 max-w-[160px] object-contain" />
    );
    return onAccent ? (
      <div className="inline-block bg-white p-1.5" style={{ borderRadius: c.radius }}>
        {img}
      </div>
    ) : (
      img
    );
  }
  const initials = d.tokens.monogram ? monogram(senderName) : "";
  if (!initials) return senderName ? <div className={className} style={style}>{senderName}</div> : null;
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center font-bold"
        style={{ backgroundColor: onAccent ? P.onAccent : P.accent, color: onAccent ? P.accent : P.onAccent, borderRadius: c.radius, fontFamily: c.display, fontSize: 15 }}
      >
        {initials}
      </span>
      {senderName ? (
        <div className={cx("min-w-0", className)} style={style}>
          {senderName}
        </div>
      ) : null}
    </div>
  );
}

function Meta({ c, label, value, light }: { c: Ctx; label: string; value: string; light?: boolean }) {
  return (
    <div className="flex justify-end gap-2">
      <span style={light ? { color: c.P.onAccent, opacity: 0.85 } : { color: c.P.muted }}>{label}</span>
      <span className="min-w-[96px] font-semibold">{value}</span>
    </div>
  );
}

function Header({ c }: { c: Ctx }) {
  const { quote, d, L, P, px, display, italic, title } = c;
  const tk = d.tokens;
  const fs = tk.fontSize;
  const number = quote.number;
  const date = formatDate(quote.date, quote.lang);
  const valid = formatDate(validUntil(quote), quote.lang);
  switch (tk.layout) {
    case "swiss":
      return (
        <>
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 shrink-0" style={{ backgroundColor: P.accent }} />
                <span className="font-semibold uppercase tracking-[0.16em]" style={{ fontSize: px(fs - 2), color: P.muted }}>
                  {title ? `${L.quote} · ${number}` : `${L.number} ${number}`}
                </span>
              </div>
              <div className="mt-1.5 font-semibold leading-tight tracking-tight" style={{ fontSize: px(fs + 10.5), fontFamily: display }}>
                {title || L.quote}
              </div>
            </div>
            <div className="max-w-[40%] text-right">
              <Brand c={c} onAccent={false} className="font-semibold" style={{ fontSize: px(fs + 2.5) }} />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 border-y py-2.5" style={{ borderColor: P.ink }}>
            {(
              [
                [L.number, number],
                [L.date, date],
                [L.validUntil, valid],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <Label c={c}>{k}</Label>
                <div className="font-semibold">{v}</div>
              </div>
            ))}
          </div>
        </>
      );
    case "masthead":
      return (
        <>
          <div className="flex flex-col items-center text-center">
            <Brand c={c} onAccent={false} className="font-semibold" style={{ fontFamily: display, fontSize: px(fs + 5), color: P.deep }} />
            <div className="my-2.5 h-[2px] w-7" style={{ backgroundColor: P.accent }} />
            <div className="font-semibold tracking-[0.3em]" style={{ fontFamily: display, fontSize: px(fs + 14), color: P.deep }}>
              {L.quote}
            </div>
            <div className={cx("mt-1.5", italic)} style={{ color: P.muted, fontSize: px(fs - 1) }}>
              {L.number} {number} · {L.date} {date} · {L.validUntil} {valid}
            </div>
          </div>
          <div className="mt-4 h-1 border-y" style={{ borderColor: P.ink }} />
        </>
      );
    case "dense":
      return (
        <>
          <div className="flex items-center justify-between gap-4">
            <div className="max-w-[55%]">
              <Brand c={c} onAccent={false} className="font-bold" style={{ fontFamily: display, fontSize: px(fs + 4), color: P.deep }} />
            </div>
            <div className="text-right">
              <div className="font-bold tracking-wider" style={{ fontFamily: display, fontSize: px(fs + 6.5), color: P.accent }}>
                {L.quote}
              </div>
              <div className="mt-0.5" style={{ color: P.muted, fontSize: px(fs - 1) }}>
                {L.number} <b style={{ color: P.ink }}>{number}</b> · {L.date} <b style={{ color: P.ink }}>{date}</b> · {L.validUntil} <b style={{ color: P.ink }}>{valid}</b>
              </div>
            </div>
          </div>
          <div className="mt-2.5 h-px" style={{ backgroundColor: P.rule }} />
        </>
      );
    case "sidebar":
      return (
        <>
          <div className="font-bold leading-none tracking-tight" style={{ fontFamily: display, fontSize: px(fs + 16.5) }}>
            {L.quote}
          </div>
          {title ? (
            <div className="mt-2" style={{ color: P.muted, fontSize: px(fs + 2.5) }}>
              {title}
            </div>
          ) : null}
        </>
      );
    case "hero":
      // The band above the page carries the header
      return null;
    default:
      return (
        <>
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-[55%]">
              <Brand c={c} onAccent={false} className="font-bold leading-tight" style={{ fontFamily: display, fontSize: px(fs + 6.5), color: P.deep }} />
            </div>
            <div className="text-right">
              <div className="font-bold tracking-[0.08em]" style={{ fontFamily: display, fontSize: px(fs + 12.5), color: P.accent }}>
                {L.quote}
              </div>
              <div className="mt-2 space-y-0.5">
                <Meta c={c} label={L.number} value={number} />
                <Meta c={c} label={L.date} value={date} />
                <Meta c={c} label={L.validUntil} value={valid} />
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-start">
            <div className="h-[3px] w-16" style={{ backgroundColor: P.accent }} />
            <div className="mt-px h-px flex-1" style={{ backgroundColor: P.line }} />
          </div>
        </>
      );
  }
}

/** Full-width colour band of the "hero" layout: the sender, the title, the dates and the amount due. */
function HeroBand({ c }: { c: Ctx }) {
  const { quote, d, L, P, t, money, px, display, senderName } = c;
  const fs = d.tokens.fontSize;
  const head = headlineAmount(t, L);
  const contact = [senderName, ...addressLines(quote.sender), quote.sender.email, quote.sender.phone].filter(Boolean).join(" · ");
  return (
    <div className="flex min-h-[184px] flex-col justify-between px-8 pb-7 pt-9 sm:px-12" style={{ backgroundColor: P.accent, color: P.onAccent }}>
      <div className="flex items-start justify-between gap-6">
        <div className="max-w-[55%]">
          <Brand c={c} onAccent className="font-bold leading-tight" style={{ fontFamily: display, fontSize: px(fs + 6), color: P.onAccent }} />
        </div>
        <div className="text-right">
          <div className="font-bold leading-none" style={{ fontFamily: display, fontSize: px(fs + 16.5) }}>
            {L.quote}
          </div>
          <div className="mt-2" style={{ fontSize: px(fs - 1), opacity: 0.85 }}>
            {L.number} {quote.number} · {L.date} {formatDate(quote.date, quote.lang)}
          </div>
          <div style={{ fontSize: px(fs - 1), opacity: 0.85 }}>
            {L.validUntil} {formatDate(validUntil(quote), quote.lang)}
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-end justify-between gap-6">
        <div className="max-w-[55%]" style={{ fontSize: px(fs - 1), opacity: 0.85 }}>
          {contact}
        </div>
        {d.tokens.heroTotal ? (
          <div className="text-right">
            <div className="uppercase tracking-[0.09em]" style={{ fontSize: px(fs - 2.5), opacity: 0.85 }}>
              {head.label}
            </div>
            <div className="font-bold leading-tight" style={{ fontFamily: display, fontSize: px(fs + 11) }}>
              {money(head.value)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Fixed colour column of the "sidebar" layout: the sender, the dates and the amount due. */
function Sidebar({ c }: { c: Ctx }) {
  const { quote, d, L, P, t, money, px, display, senderName } = c;
  const fs = d.tokens.fontSize;
  const head = headlineAmount(t, L);
  return (
    <aside className="w-[118px] shrink-0 px-3.5 pb-10 pt-11 sm:w-[162px] sm:px-4" style={{ backgroundColor: P.accent, color: P.onAccent }}>
      <Brand c={c} onAccent className="font-bold leading-tight" style={{ fontFamily: display, fontSize: px(fs + 2.5) }} />
      {quote.branding.logo && senderName ? (
        <div className="mt-3 font-bold leading-tight" style={{ fontFamily: display, fontSize: px(fs + 2.5) }}>
          {senderName}
        </div>
      ) : null}
      <div className="mt-1.5 break-words" style={{ fontSize: px(fs - 1.5), opacity: 0.85 }}>
        {partyRows(quote.sender, L).map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {(
          [
            [L.number, quote.number],
            [L.date, formatDate(quote.date, quote.lang)],
            [L.validUntil, formatDate(validUntil(quote), quote.lang)],
          ] as const
        ).map(([k, v]) => (
          <div key={k}>
            <div className="uppercase tracking-[0.09em]" style={{ fontSize: px(fs - 2.5), opacity: 0.7 }}>
              {k}
            </div>
            <div className="font-bold">{v}</div>
          </div>
        ))}
      </div>
      {d.tokens.heroTotal ? (
        <div className="mt-5 border-t pt-3" style={{ borderColor: P.onAccent }}>
          <div className="uppercase tracking-[0.09em]" style={{ fontSize: px(fs - 2.5), opacity: 0.7 }}>
            {head.label}
          </div>
          <div className="font-bold leading-tight break-words" style={{ fontFamily: display, fontSize: px(fs + 7) }}>
            {money(head.value)}
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function ItemsTable({ c }: { c: Ctx }) {
  const { quote, d, L, P, t, money, px, italic } = c;
  const tk = d.tokens;
  const fs = tk.fontSize;
  const cols = d.columns;
  const showDisc = quote.items.some((i) => (i.discountPct ?? 0) > 0);
  const mono = tk.layout === "swiss" || tk.layout === "masthead";
  const thStyle: CSSProperties =
    tk.tableHeader === "filled"
      ? { backgroundColor: P.accent, color: P.onAccent }
      : tk.tableHeader === "double"
        ? { color: P.ink, borderTop: `1px solid ${P.ink}`, borderBottom: `1px solid ${P.ink}` }
        : { color: P.muted, borderBottom: `2px solid ${mono ? P.ink : P.accent}` };
  const th = "px-2 py-2 font-semibold uppercase tracking-[0.06em]";
  const td = "border-b px-2 py-2 align-top";
  const num = td + " whitespace-nowrap text-right";
  const first = tk.tableHeader === "filled" && tk.radius ? { borderTopLeftRadius: c.radius } : {};
  const last = tk.tableHeader === "filled" && tk.radius ? { borderTopRightRadius: c.radius } : {};
  return (
    <table className="mt-4 w-full border-collapse">
      <thead>
        <tr className="text-left" style={{ ...thStyle, fontSize: px(fs - 2.5) }}>
          {tk.numbered ? <th className={th} style={{ ...first, width: 26 }} /> : null}
          <th className={th} style={tk.numbered ? {} : first}>
            {L.description}
          </th>
          {cols.qty ? <th className={th + " text-right"}>{L.qty}</th> : null}
          {cols.unitPrice ? <th className={th + " text-right"}>{L.unitPrice}</th> : null}
          {showDisc ? <th className={th + " text-right"}>{L.discount}</th> : null}
          {cols.vat ? <th className={th + " text-right"}>{L.vatRate}</th> : null}
          <th className={th + " text-right"} style={last}>
            {L.amount}
          </th>
        </tr>
      </thead>
      <tbody>
        {quote.items.map((it, idx) => {
          const lt = t.lines[idx];
          const rowStyle: CSSProperties = tk.zebra && idx % 2 === 1 ? { backgroundColor: P.tint } : {};
          const cell: CSSProperties = { borderColor: P.rule };
          return (
            <tr key={it.id} style={rowStyle}>
              {tk.numbered ? (
                <td className={td + " font-bold"} style={{ ...cell, color: P.deep, fontSize: px(fs - 1) }}>
                  {itemIndex(idx)}
                </td>
              ) : null}
              <td className={td} style={cell}>
                <div className="font-semibold">{it.description || "—"}</div>
                {it.details ? (
                  <div className={cx("mt-0.5", italic)} style={{ color: P.muted, fontSize: px(fs - 1) }}>
                    {it.details}
                  </div>
                ) : null}
              </td>
              {cols.qty ? (
                <td className={num} style={cell}>
                  {formatNumber(it.quantity, quote.lang, 3)}
                  {it.unit ? ` ${it.unit}` : ""}
                </td>
              ) : null}
              {cols.unitPrice ? (
                <td className={num} style={cell}>
                  {money(it.unitPrice)}
                </td>
              ) : null}
              {showDisc ? (
                <td className={num} style={cell}>
                  {it.discountPct ? formatPct(it.discountPct, quote.lang) : "—"}
                </td>
              ) : null}
              {cols.vat ? (
                <td className={num} style={cell}>
                  {formatNumber(lt.vatRate, quote.lang)}%
                </td>
              ) : null}
              <td className={cx(num, !mono && "font-semibold")} style={cell}>
                {money(lt.net)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function TotalLine({ c, label, value }: { c: Ctx; label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 px-2 py-0.5">
      <span style={{ color: c.P.muted }}>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

/** The amount the client pays, highlighted the way the style asks for. */
function Headline({ c, label, value }: { c: Ctx; label: string; value: string }) {
  const { P, d, px, display } = c;
  const tk = d.tokens;
  const style: CSSProperties =
    tk.payable === "filled"
      ? { backgroundColor: P.accent, color: P.onAccent, borderRadius: c.radius }
      : tk.payable === "panel"
        ? { backgroundColor: P.tint, color: P.deep, borderRadius: c.radius }
        : tk.payable === "outline"
          ? { border: `1.5px solid ${P.accent}`, color: P.deep, borderRadius: c.radius }
          : { borderTop: `2px solid ${P.accent}`, color: P.deep };
  return (
    <div className={cx("mt-1.5 flex items-center justify-between gap-3 py-2", tk.payable === "rule" ? "px-2" : "px-2.5")} style={style}>
      <span className="font-bold" style={{ fontSize: px(tk.fontSize + 1) }}>
        {label}
      </span>
      <span className="font-bold" style={{ fontFamily: display, fontSize: px(tk.fontSize + 5) }}>
        {value}
      </span>
    </div>
  );
}

function TotalsBlock({ c }: { c: Ctx }) {
  const { quote, L, P, t, money, px, d } = c;
  const lang = quote.lang;
  return (
    <div className="mt-3 flex justify-end">
      <div className="w-full max-w-[300px] space-y-0.5">
        {t.lineDiscounts > 0 || t.globalDiscount > 0 ? <TotalLine c={c} label={L.subtotal} value={money(t.subtotal)} /> : null}
        {t.lineDiscounts > 0 ? <TotalLine c={c} label={L.lineDiscounts} value={`-${money(t.lineDiscounts)}`} /> : null}
        {t.globalDiscount > 0 ? <TotalLine c={c} label={`${L.globalDiscount} ${formatPct(quote.options.globalDiscountPct, lang)}`} value={`-${money(t.globalDiscount)}`} /> : null}
        <TotalLine c={c} label={L.net} value={money(t.net)} />
        {t.rivalsa > 0 ? (
          <>
            <TotalLine c={c} label={rivalsaCaption(quote.options, lang)} value={money(t.rivalsa)} />
            <TotalLine c={c} label={L.taxable} value={money(t.taxable)} />
          </>
        ) : null}
        {t.vatGroups.map((g) => (
          <TotalLine key={g.rate} c={c} label={`${L.vatOn} ${formatNumber(g.rate, lang)}%${t.vatGroups.length > 1 ? ` (${money(g.base)})` : ""}`} value={money(g.vat)} />
        ))}
        {t.bollo > 0 ? <TotalLine c={c} label={L.bollo} value={money(t.bollo)} /> : null}
        {t.ritenuta > 0 ? (
          <>
            <div className="mt-1 flex justify-between gap-3 border-t px-2 py-1.5 font-bold" style={{ borderColor: P.ink, fontSize: px(d.tokens.fontSize + 1.5) }}>
              <span>{L.total}</span>
              <span>{money(t.total)}</span>
            </div>
            <TotalLine c={c} label={`${L.ritenuta} ${formatPct(quote.options.ritenutaAccontoPct, lang)}`} value={`-${money(t.ritenuta)}`} />
            <Headline c={c} label={L.netPayable} value={money(t.netPayable)} />
          </>
        ) : (
          <Headline c={c} label={L.total} value={money(t.total)} />
        )}
        {t.deposit > 0 ? <TotalLine c={c} label={`${L.deposit} (${formatPct(quote.options.depositPct, lang)})`} value={money(t.deposit)} /> : null}
      </div>
    </div>
  );
}

function Cover({ c, watermarkEl, pad }: { c: Ctx; watermarkEl: React.ReactNode; pad: string }) {
  const { quote, d, L, P, px, display, italic, senderName, title } = c;
  const cover = d.cover;
  if (!cover) return null;
  const tk = d.tokens;
  const fs = tk.fontSize;
  const centered = tk.layout === "masthead";
  const band = !(tk.layout === "swiss" || tk.layout === "masthead");
  const contact = [senderName, ...addressLines(quote.sender), quote.sender.email, quote.sender.phone].filter(Boolean).join(" · ");
  /** The cover title falls back to the subject, then to the document title */
  const coverTitle = cover.title || title || L.quote;
  const meta: [string, string][] = [
    [L.to, quote.client.name || "—"],
    [L.date, formatDate(quote.date, quote.lang)],
    [L.validUntil, formatDate(validUntil(quote), quote.lang)],
  ];
  return (
    <div className="relative overflow-hidden border-b-8 border-slate-100" style={{ minHeight: 560 }}>
      {watermarkEl}
      {band ? (
        <div className={cx("min-h-[150px] pt-11", pad)} style={{ backgroundColor: P.accent, color: P.onAccent }}>
          <Brand c={c} onAccent className="font-bold leading-tight" style={{ fontFamily: display, fontSize: px(fs + 8) }} />
        </div>
      ) : null}
      <div className={cx("relative", pad, centered ? "flex flex-col items-center pt-28 text-center" : band ? "pt-14" : "pt-24")}>
        {!band && !centered ? <div className="mb-5 h-2.5 w-2.5" style={{ backgroundColor: P.accent }} /> : null}
        {!band ? (
          <div className={cx("mb-6", centered && "flex flex-col items-center")}>
            <Brand c={c} onAccent={false} className="font-semibold" style={centered ? { fontFamily: display, fontSize: px(fs + 5), color: P.deep } : { fontSize: px(fs + 3) }} />
            {centered ? <div className="my-2.5 h-[2px] w-7" style={{ backgroundColor: P.accent }} /> : null}
          </div>
        ) : null}
        <div className="font-semibold uppercase tracking-[0.16em]" style={{ fontSize: px(fs - 2), color: P.muted }}>
          {coverTitle === L.quote ? `${L.number} ${quote.number}` : `${L.quote} ${quote.number}`}
        </div>
        <div className="mt-2 font-bold leading-tight" style={{ fontFamily: display, fontSize: px(fs + 24), color: P.deep }}>
          {coverTitle}
        </div>
        {cover.subtitle ? (
          <div className={cx("mt-2", italic)} style={{ color: P.muted, fontSize: px(fs + 4) }}>
            {cover.subtitle}
          </div>
        ) : null}
        {cover.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.image} alt="" className="mt-6 max-h-56 w-full object-contain" />
        ) : null}
        {centered ? <div className="mt-7 h-1 w-44 border-y" style={{ borderColor: P.ink }} /> : null}
        <div className={cx("mt-8 space-y-0.5 pt-3", !centered && "border-t")} style={{ borderColor: P.rule }}>
          {meta.map(([k, v]) => (
            <div key={k} className={cx("flex gap-2", centered && "justify-center")}>
              <span className={cx("shrink-0", !centered && "w-28")} style={{ color: P.muted }}>
                {k}
              </span>
              <span className="font-semibold">{v}</span>
            </div>
          ))}
        </div>
        <div className="mt-10 pb-6" style={{ fontSize: px(7.5), color: P.faint }}>
          {contact}
        </div>
      </div>
    </div>
  );
}

/** HTML twin of the PDF layout, used for the live preview, the shared page and the landing hero. */
export function QuotePreview({ quote, watermark = false, className = "" }: { quote: Quote; watermark?: boolean; className?: string }) {
  const d = resolveDesign(quote);
  const tk = d.tokens;
  const P = d.palette;
  const L = d.labels;
  const t = computeTotals(quote);
  const fs = tk.fontSize;
  const px = (pt: number) => Math.round(pt * 1.16 * 2) / 2;
  const mono = tk.layout === "swiss" || tk.layout === "masthead";
  const c: Ctx = {
    quote,
    d,
    L,
    P,
    t,
    money: (n: number) => formatMoney(n, quote.currency, quote.lang),
    px,
    body: DOC_FONT_FAMILY[tk.font],
    display: DOC_FONT_FAMILY[tk.display],
    italic: tk.layout === "masthead" ? "italic" : "",
    radius: `${Math.round(tk.radius * 1.16)}px`,
    labelColor: mono ? P.muted : P.deep,
    senderName: quote.sender.name,
    title: quote.subject ?? "",
  };
  const hasExempt = t.vatGroups.some((g) => g.rate === 0);
  const occasionale = !quote.options.regimeForfettario && Boolean(quote.options.prestazioneOccasionale);
  /** The swiss headline and the sidebar body already print the subject */
  const subjectRow = c.title && tk.layout !== "swiss" && tk.layout !== "sidebar";
  const pad = tk.margins.x >= 56 ? "px-9 sm:px-16" : tk.margins.x >= 50 ? "px-8 sm:px-14" : tk.margins.x >= 44 ? "px-8 sm:px-12" : "px-6 sm:px-9";
  const padTop = tk.layout === "hero" ? "pt-6" : tk.margins.top >= 46 ? "pt-12" : tk.margins.top >= 40 ? "pt-10" : "pt-8";

  const watermarkEl = watermark ? (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <span className="-rotate-30 select-none text-7xl font-bold tracking-[0.3em]" style={{ color: P.rule, opacity: 0.7, fontFamily: c.display }}>
        {L.preview}
      </span>
    </div>
  ) : null;

  const body = (
    <>
      {tk.layout === "hero" ? <HeroBand c={c} /> : null}
      <div className={cx("relative", pad, padTop, "pb-10")}>
        <Header c={c} />

        {/* parties */}
        {tk.layout === "sidebar" ? (
          <div className="mt-5 grid grid-cols-2 gap-4">
            <PartyBlock c={c} party={quote.client} label={L.to} />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <PartyBlock c={c} party={quote.sender} label={L.from} />
            <PartyBlock c={c} party={quote.client} label={L.to} card={tk.clientCard} />
          </div>
        )}

        {subjectRow ? (
          <div className="mt-4 flex items-baseline gap-1.5">
            <span style={{ color: P.muted }}>{L.subject}:</span>
            <span className="font-semibold" style={{ fontSize: px(fs + 1) }}>
              {c.title}
            </span>
          </div>
        ) : null}

        {d.intro ? <p className="mt-3 whitespace-pre-line">{d.intro}</p> : null}

        <ItemsTable c={c} />
        <TotalsBlock c={c} />

        {quote.notes || quote.paymentTerms ? (
          <div className="mt-6 grid grid-cols-2 gap-5">
            {quote.notes ? (
              <div>
                <Label c={c}>{L.notes}</Label>
                <div className="mt-1 whitespace-pre-line">{quote.notes}</div>
              </div>
            ) : null}
            {quote.paymentTerms ? (
              <div>
                <Label c={c}>{L.paymentTerms}</Label>
                <div className="mt-1 whitespace-pre-line">{quote.paymentTerms}</div>
              </div>
            ) : null}
          </div>
        ) : null}

        {quote.options.regimeForfettario || occasionale || hasExempt || t.bollo > 0 ? (
          <div className="mt-4 space-y-0.5" style={{ color: P.muted, fontSize: px(fs - 1.5) }}>
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

        {d.closing ? (
          <p className="mt-4 whitespace-pre-line border-t pt-3" style={{ borderColor: P.rule }}>
            {d.closing}
          </p>
        ) : null}

        {d.showSignature || d.showValidity ? (
          <div className="mt-8 flex items-end justify-between gap-4">
            <div style={{ color: P.muted, fontSize: px(fs - 1.5) }}>{d.showValidity ? `${L.validUntil} ${formatDate(validUntil(quote), quote.lang)}` : ""}</div>
            {d.showSignature ? (
              <div className="w-[230px] max-w-[48%] border-t pt-1" style={{ borderColor: P.ink, color: P.muted, fontSize: px(fs - 1.5) }}>
                <div className="font-semibold" style={{ color: P.ink }}>
                  {L.acceptance}
                </div>
                <div>{L.signature}</div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    // Phones get the page scaled down like a thumbnail instead of six columns scrolling sideways
    <div className={cx("bg-white tabular-nums [zoom:0.72] sm:[zoom:1]", className)} style={{ fontFamily: c.body, fontSize: px(fs), lineHeight: 1.35, color: P.ink }}>
      <Cover c={c} watermarkEl={watermarkEl} pad={pad} />
      <div className="relative overflow-hidden">
        {watermarkEl}
        {tk.layout === "sidebar" ? (
          <div className="flex">
            <Sidebar c={c} />
            <div className="min-w-0 flex-1">{body}</div>
          </div>
        ) : tk.layout === "dense" ? (
          <div className="flex">
            <div className="w-2 shrink-0 self-stretch" style={{ backgroundColor: P.accent }} />
            <div className="min-w-0 flex-1">{body}</div>
          </div>
        ) : (
          body
        )}
      </div>
    </div>
  );
}
