"use client";

import Link from "next/link";
import { useState } from "react";
import { NumberInput } from "@/components/builder/NumberInput";
import { Field, Icon, Select, Toggle } from "@/components/ui";
import { computeTotals, formatMoney, newLineItem, newQuote, round2, type Quote, type RivalsaKind } from "@/lib/quote";

export type CalcRegime = "ordinario" | "forfettario" | "occasionale";
export type CalcState = {
  amount: number;
  vat: number;
  regime: CalcRegime;
  rivalsa: boolean;
  rivalsaKind: RivalsaKind;
  ritenuta: boolean;
  bollo: boolean;
};
export type CalcShow = Partial<Record<"regime" | "vat" | "rivalsa" | "ritenuta" | "bollo", boolean>>;

const VAT_RATES = [22, 10, 5, 4, 0];

/** A deterministic one-line quote, so the calculators reuse the real fiscal engine. */
export function calcQuote(s: CalcState): Quote {
  return newQuote({
    id: "calc",
    number: "CALC",
    date: "2026-01-01",
    createdAt: 0,
    updatedAt: 0,
    items: [newLineItem({ id: "c1", description: "Compenso", quantity: 1, unitPrice: s.amount, vatRate: s.vat })],
    options: {
      globalDiscountPct: 0,
      rivalsaInpsPct: s.rivalsa && s.regime !== "occasionale" ? 4 : 0,
      rivalsaKind: s.rivalsaKind,
      ritenutaAccontoPct: s.ritenuta && s.regime !== "forfettario" ? 20 : 0,
      regimeForfettario: s.regime === "forfettario",
      prestazioneOccasionale: s.regime === "occasionale",
      bollo: s.bollo,
      depositPct: 0,
    },
  });
}

export function builderHref(s: CalcState): string {
  const p = new URLSearchParams();
  p.set("regime", s.regime);
  p.set("amount", String(s.amount));
  if (s.regime !== "occasionale") p.set("rivalsa", s.rivalsa ? (s.rivalsaKind === "cassa" ? "cassa" : "4") : "0");
  if (s.regime !== "forfettario") p.set("ritenuta", s.ritenuta ? "20" : "0");
  if (s.regime === "ordinario") p.set("vat", String(s.vat));
  return `/app?${p.toString()}`;
}

const money = (n: number) => formatMoney(n, "EUR", "it");

export function FiscalCalculator({
  initial,
  show = {},
  title,
  cta = "Crea il preventivo con questi numeri",
}: {
  initial: CalcState;
  show?: CalcShow;
  title: string;
  cta?: string;
}) {
  const [s, setS] = useState<CalcState>(initial);
  const set = (patch: Partial<CalcState>) => setS((prev) => ({ ...prev, ...patch }));
  const v = { regime: true, vat: true, rivalsa: true, ritenuta: true, bollo: true, ...show };
  const t = computeTotals(calcQuote(s));
  const rivalsaLabel = s.rivalsaKind === "cassa" ? "Contributo integrativo 4%" : "Rivalsa INPS 4%";
  const vatCaption = s.regime === "forfettario" ? "IVA: non applicata (forfettario)" : s.regime === "occasionale" ? "IVA: non applicata (fuori campo)" : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Field label="Compenso (imponibile, senza IVA)">
            <NumberInput value={s.amount} onChange={(n) => set({ amount: Math.max(0, n) })} />
          </Field>
          {v.regime ? (
            <Field label="Regime fiscale">
              <Select value={s.regime} onChange={(e) => set({ regime: e.target.value as CalcRegime })}>
                <option value="ordinario">Ordinario (con IVA)</option>
                <option value="forfettario">Forfettario</option>
                <option value="occasionale">Prestazione occasionale (senza P. IVA)</option>
              </Select>
            </Field>
          ) : null}
          {v.vat && s.regime === "ordinario" ? (
            <Field label="Aliquota IVA">
              <Select value={s.vat} onChange={(e) => set({ vat: Number(e.target.value) })}>
                {VAT_RATES.map((r) => (
                  <option key={r} value={r}>
                    {r}%
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          {v.rivalsa && s.regime !== "occasionale" ? (
            <>
              <Toggle checked={s.rivalsa} onChange={(b) => set({ rivalsa: b })} label="Rivalsa INPS o contributo cassa 4%" help="Per iscritti alla Gestione Separata INPS o a una cassa di previdenza." />
              {s.rivalsa ? (
                <Field label="Il 4% va a">
                  <Select value={s.rivalsaKind} onChange={(e) => set({ rivalsaKind: e.target.value === "cassa" ? "cassa" : "inps" })}>
                    <option value="inps">INPS Gestione Separata (rivalsa, entra nella ritenuta)</option>
                    <option value="cassa">Cassa di previdenza (contributo integrativo, fuori dalla ritenuta)</option>
                  </Select>
                </Field>
              ) : null}
            </>
          ) : null}
          {v.ritenuta && s.regime !== "forfettario" ? (
            <Toggle checked={s.ritenuta} onChange={(b) => set({ ritenuta: b })} label="Ritenuta d'acconto 20%" help="Solo se il cliente è un sostituto d'imposta: azienda, professionista, ente. Con i privati no." />
          ) : null}
          {v.bollo ? <Toggle checked={s.bollo} onChange={(b) => set({ bollo: b })} label="Imposta di bollo 2 €" help="Dovuta sopra 77,47 € senza IVA; qui la addebitiamo al cliente." /> : null}
        </div>
        <div>
          <dl className="overflow-hidden rounded-xl border border-slate-200 text-sm">
            <Row k="Compenso" v={money(t.net)} />
            {t.rivalsa > 0 ? <Row k={rivalsaLabel} v={money(t.rivalsa)} /> : null}
            {t.rivalsa > 0 ? <Row k="Totale imponibile" v={money(t.taxable)} /> : null}
            {vatCaption ? <Row k={vatCaption} v={money(0)} muted /> : t.vatGroups.map((g) => <Row key={g.rate} k={`IVA ${g.rate}%`} v={money(g.vat)} />)}
            {t.bollo > 0 ? <Row k="Imposta di bollo" v={money(t.bollo)} /> : null}
            <Row k="Totale documento" v={money(t.total)} strong />
            {t.ritenuta > 0 ? <Row k={`Ritenuta d'acconto 20% su ${money(s.rivalsaKind === "cassa" ? t.net : t.taxable)}`} v={`-${money(t.ritenuta)}`} /> : null}
            <Row k="Netto a pagare, quello che incassi" v={money(t.netPayable)} highlight />
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            {t.ritenuta > 0 ? `I ${money(t.ritenuta)} trattenuti li recuperi in dichiarazione dei redditi come credito d'imposta. ` : ""}
            Calcolo indicativo: verifica il tuo caso con il commercialista.
          </p>
          <Link href={builderHref(s)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
            <Icon name="bolt" className="h-4 w-4" /> {cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, strong, highlight, muted }: { k: string; v: string; strong?: boolean; highlight?: boolean; muted?: boolean }) {
  const cls = highlight ? "bg-indigo-600 font-bold text-white" : strong ? "border-t border-slate-200 font-bold text-slate-900" : muted ? "text-slate-400" : "text-slate-700";
  return (
    <div className={"flex items-center justify-between gap-4 px-4 py-2 " + cls}>
      <dt>{k}</dt>
      <dd className="whitespace-nowrap font-medium">{v}</dd>
    </div>
  );
}

/** From an amount agreed "including the 4%" back to the fee. */
export function ScorporoRivalsa() {
  const [lordo, setLordo] = useState(1040);
  const netto = round2(lordo / 1.04);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900">Scorporo: da lordo con rivalsa a compenso</h3>
      <p className="mt-1 text-sm text-slate-600">Hai concordato un importo “compresa rivalsa”? Dividi per 1,04.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="Importo concordato (rivalsa inclusa)">
          <NumberInput value={lordo} onChange={(n) => setLordo(Math.max(0, n))} />
        </Field>
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="text-slate-500">Compenso</div>
          <div className="font-semibold text-slate-900">{money(netto)}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="text-slate-500">Rivalsa 4%</div>
          <div className="font-semibold text-slate-900">{money(round2(lordo - netto))}</div>
        </div>
      </div>
    </div>
  );
}
