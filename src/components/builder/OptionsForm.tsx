"use client";

import { useLocale } from "@/lib/i18n/context";
import { SUPPORTED_CURRENCIES, type Quote, type QuoteOptions } from "@/lib/quote";
import { Field, Input, Select, Toggle } from "../ui";
import { NumberInput } from "./NumberInput";

export function DetailsForm({ quote, onChange }: { quote: Quote; onChange: (patch: Partial<Quote>) => void }) {
  const { t } = useLocale();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
      <Field label={t("b.opt.subject")} className="col-span-2 sm:col-span-6">
        <Input value={quote.subject ?? ""} onChange={(e) => onChange({ subject: e.target.value })} placeholder={t("b.opt.subjectPh")} />
      </Field>
      <Field label={t("b.opt.number")} className="sm:col-span-2">
        <Input value={quote.number} onChange={(e) => onChange({ number: e.target.value })} />
      </Field>
      <Field label={t("b.opt.date")} className="sm:col-span-2">
        <Input type="date" value={quote.date} onChange={(e) => e.target.value && onChange({ date: e.target.value })} />
      </Field>
      <Field label={t("b.opt.validity")} className="sm:col-span-2">
        <NumberInput value={quote.validityDays} onChange={(n) => onChange({ validityDays: Math.max(0, Math.floor(n)) })} />
      </Field>
      <Field label={t("b.opt.currency")} className="sm:col-span-3">
        <Select value={quote.currency} onChange={(e) => onChange({ currency: e.target.value })}>
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("b.opt.lang")} className="sm:col-span-3">
        <Select value={quote.lang} onChange={(e) => onChange({ lang: e.target.value === "en" ? "en" : "it" })}>
          <option value="it">{t("b.langIt")}</option>
          <option value="en">{t("b.langEn")}</option>
        </Select>
      </Field>
    </div>
  );
}

export function OptionsForm({ quote, onChange }: { quote: Quote; onChange: (patch: Partial<Quote>) => void }) {
  const { t } = useLocale();
  const o = quote.options;
  const set = (patch: Partial<QuoteOptions>) => onChange({ options: { ...o, ...patch } });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("b.opt.globalDiscount")}>
          <NumberInput value={o.globalDiscountPct} onChange={(n) => set({ globalDiscountPct: Math.min(100, Math.max(0, n)) })} />
        </Field>
        <Field label={t("b.opt.deposit")} hint={t("b.opt.depositHelp")}>
          <NumberInput value={o.depositPct} onChange={(n) => set({ depositPct: Math.min(100, Math.max(0, n)) })} />
        </Field>
      </div>
      <Toggle checked={o.regimeForfettario} onChange={(v) => set({ regimeForfettario: v, ritenutaAccontoPct: v ? 0 : o.ritenutaAccontoPct })} label={t("b.opt.forfettario")} help={t("b.opt.forfettarioHelp")} />
      <Toggle checked={o.rivalsaInpsPct > 0} onChange={(v) => set({ rivalsaInpsPct: v ? 4 : 0 })} label={t("b.opt.rivalsa")} help={t("b.opt.rivalsaHelp")} />
      {!o.regimeForfettario ? (
        <Toggle checked={o.ritenutaAccontoPct > 0} onChange={(v) => set({ ritenutaAccontoPct: v ? 20 : 0 })} label={t("b.opt.ritenuta")} help={t("b.opt.ritenutaHelp")} />
      ) : null}
      <Toggle checked={o.bollo} onChange={(v) => set({ bollo: v })} label={t("b.opt.bollo")} help={t("b.opt.bolloHelp")} />
      {!o.regimeForfettario && quote.items.some((i) => i.vatRate === 0) ? (
        <Field label={t("b.opt.exemptNote")}>
          <Input value={o.vatExemptNote ?? ""} onChange={(e) => set({ vatExemptNote: e.target.value })} placeholder={t("b.opt.exemptNotePh")} />
        </Field>
      ) : null}
    </div>
  );
}
