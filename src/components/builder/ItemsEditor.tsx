"use client";

import { useLocale } from "@/lib/i18n/context";
import { computeTotals, formatMoney, newLineItem, type LineItem, type Quote } from "@/lib/quote";
import { Button, Field, Icon, Input, Select, Textarea } from "../ui";
import { NumberInput } from "./NumberInput";

const VAT_RATES = [22, 10, 5, 4, 0];

export function ItemsEditor({ quote, onChange }: { quote: Quote; onChange: (items: LineItem[]) => void }) {
  const { t } = useLocale();
  const items = quote.items;
  const totals = computeTotals(quote);
  const forfettario = quote.options.regimeForfettario;

  const setItem = (idx: number, patch: Partial<LineItem>) => onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const copy = [...items];
    [copy[idx], copy[j]] = [copy[j], copy[idx]];
    onChange(copy);
  };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, newLineItem({ vatRate: forfettario ? 0 : items[items.length - 1]?.vatRate ?? 22 })]);

  return (
    <div className="space-y-3">
      {items.length === 0 ? <p className="text-sm text-amber-700">{t("b.item.empty")}</p> : null}
      {items.map((it, idx) => (
        <div key={it.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <div className="flex items-start gap-2">
            <span className="mt-2 w-5 shrink-0 text-xs font-semibold text-slate-400">{idx + 1}.</span>
            <div className="min-w-0 flex-1 space-y-2">
              <Input
                value={it.description}
                onChange={(e) => setItem(idx, { description: e.target.value })}
                placeholder={t("b.item.description")}
                className="font-medium"
              />
              <Textarea
                value={it.details ?? ""}
                onChange={(e) => setItem(idx, { details: e.target.value })}
                placeholder={t("b.item.details")}
                className="min-h-[40px] text-xs"
                rows={1}
              />
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                <Field label={t("b.item.qty")}>
                  <NumberInput value={it.quantity} onChange={(n) => setItem(idx, { quantity: n })} />
                </Field>
                <Field label={t("b.item.unit")}>
                  <Input value={it.unit ?? ""} onChange={(e) => setItem(idx, { unit: e.target.value })} placeholder={t("b.item.unitPh")} maxLength={20} />
                </Field>
                <Field label={t("b.item.price")} className="sm:col-span-2">
                  <NumberInput value={it.unitPrice} onChange={(n) => setItem(idx, { unitPrice: n })} />
                </Field>
                <Field label={t("b.item.vat")}>
                  <Select value={String(forfettario ? 0 : it.vatRate)} disabled={forfettario} onChange={(e) => setItem(idx, { vatRate: Number(e.target.value) })}>
                    {(VAT_RATES.includes(it.vatRate) ? VAT_RATES : [it.vatRate, ...VAT_RATES]).map((r) => (
                      <option key={r} value={r}>
                        {r}%
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t("b.item.discount")}>
                  <NumberInput value={it.discountPct ?? 0} onChange={(n) => setItem(idx, { discountPct: Math.min(100, Math.max(0, n)) })} />
                </Field>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="whitespace-nowrap text-sm font-semibold text-slate-800">{formatMoney(totals.lines[idx]?.net ?? 0, quote.currency, quote.lang)}</span>
              <div className="flex gap-0.5">
                <button className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30" onClick={() => move(idx, -1)} disabled={idx === 0} title={t("b.item.up")}>
                  <Icon name="up" className="h-4 w-4" />
                </button>
                <button className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30" onClick={() => move(idx, 1)} disabled={idx === items.length - 1} title={t("b.item.down")}>
                  <Icon name="down" className="h-4 w-4" />
                </button>
                <button className="rounded p-1 text-red-500 hover:bg-red-50" onClick={() => remove(idx)} title={t("b.item.remove")}>
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      <Button variant="secondary" onClick={add}>
        <Icon name="plus" className="h-4 w-4" /> {t("b.item.add")}
      </Button>
    </div>
  );
}
