"use client";

import { useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/context";
import { labelsFor, STYLE_IDS, type DocLabels, type LabelOverrides, type Quote, type QuoteDesign } from "@/lib/quote";
import { Button, Field, Icon, Input, Modal, Textarea, Toggle, cx } from "../ui";

const LABEL_KEYS = ["title", "from", "to", "subject", "notes", "paymentTerms", "acceptance", "signature", "total", "netPayable"] as const;
const DEFAULT_KEY: Record<(typeof LABEL_KEYS)[number], keyof DocLabels> = {
  title: "quote",
  from: "from",
  to: "to",
  subject: "subject",
  notes: "notes",
  paymentTerms: "paymentTerms",
  acceptance: "acceptance",
  signature: "signature",
  total: "total",
  netPayable: "netPayable",
};
const MAX_IMAGE_BYTES = 500 * 1024;

/** "Modello e stile": everything about how the document looks, free for everyone. */
export function DesignForm({ quote, onChange, onSaveTemplate }: { quote: Quote; onChange: (patch: Partial<Quote>) => void; onSaveTemplate: (name: string) => void }) {
  const { t } = useLocale();
  const d: QuoteDesign = quote.design ?? {};
  const set = (patch: Partial<QuoteDesign>) => onChange({ design: { ...d, ...patch } });
  const setLabel = (k: keyof LabelOverrides, v: string) => set({ labels: { ...(d.labels ?? {}), [k]: v } });
  const base = labelsFor(quote.lang);
  const cols = { qty: d.columns?.qty ?? true, unitPrice: d.columns?.unitPrice ?? true, vat: d.columns?.vat ?? true };
  const cover = d.cover ?? { enabled: false };
  const style = d.style ?? "classico";
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [imgError, setImgError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (file: File | undefined) => {
    setImgError(null);
    if (!file) return;
    if (!/^image\/(png|jpeg)$/.test(file.type) || file.size > MAX_IMAGE_BYTES) {
      setImgError(t("b.design.imageTooBig"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set({ cover: { ...cover, enabled: true, image: String(reader.result) } });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div>
        <span className="mb-1 block text-xs font-medium text-slate-600">{t("b.design.style")}</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {STYLE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => set({ style: id })}
              className={cx("rounded-lg border px-3 py-2 text-left", style === id ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" : "border-slate-200 bg-white hover:border-slate-300")}
            >
              <span className="block text-sm font-medium text-slate-900">{t(`b.design.styles.${id}`)}</span>
              <span className="block text-[11px] leading-snug text-slate-500">{t(`b.design.styleDesc.${id}`)}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium text-slate-600">{t("b.design.columns")}</span>
        <div className="grid gap-2 sm:grid-cols-3">
          <Toggle checked={cols.qty} onChange={(v) => set({ columns: { ...cols, qty: v } })} label={t("b.design.colQty")} />
          <Toggle checked={cols.unitPrice} onChange={(v) => set({ columns: { ...cols, unitPrice: v } })} label={t("b.design.colUnitPrice")} />
          <Toggle checked={cols.vat} onChange={(v) => set({ columns: { ...cols, vat: v } })} label={t("b.design.colVat")} />
        </div>
      </div>

      <Field label={t("b.design.intro")} hint={t("b.design.introHelp")}>
        <Textarea value={d.intro ?? ""} onChange={(e) => set({ intro: e.target.value })} placeholder={t("b.design.introPh")} rows={3} maxLength={3000} />
      </Field>
      <Field label={t("b.design.closing")} hint={t("b.design.closingHelp")}>
        <Textarea value={d.closing ?? ""} onChange={(e) => set({ closing: e.target.value })} placeholder={t("b.design.closingPh")} rows={2} maxLength={3000} />
      </Field>

      <Toggle checked={cover.enabled} onChange={(v) => set({ cover: { ...cover, enabled: v } })} label={t("b.design.cover")} help={t("b.design.coverHelp")} />
      {cover.enabled ? (
        <div className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
          <Field label={t("b.design.coverTitle")}>
            <Input value={cover.title ?? ""} onChange={(e) => set({ cover: { ...cover, title: e.target.value } })} placeholder={t("b.design.coverTitlePh")} maxLength={200} />
          </Field>
          <Field label={t("b.design.coverSubtitle")}>
            <Input value={cover.subtitle ?? ""} onChange={(e) => set({ cover: { ...cover, subtitle: e.target.value } })} placeholder={t("b.design.coverSubtitlePh")} maxLength={300} />
          </Field>
          <Field label={t("b.design.coverImage")} className="sm:col-span-2">
            <div className="flex items-center gap-3">
              {cover.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover.image} alt="" className="h-14 max-w-[160px] rounded border border-slate-200 bg-white object-contain p-1" />
              ) : null}
              <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                <Icon name="file" className="h-4 w-4" /> {t("b.design.coverImageUpload")}
              </Button>
              {cover.image ? (
                <Button variant="danger" size="sm" onClick={() => set({ cover: { ...cover, image: undefined } })}>
                  {t("b.design.coverImageRemove")}
                </Button>
              ) : null}
            </div>
            {imgError ? <span className="mt-1 block text-xs text-red-600">{imgError}</span> : null}
          </Field>
        </div>
      ) : null}

      <details className="group rounded-lg border border-slate-200 p-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-slate-800">
          {t("b.design.labels")}
          <Icon name="chevron" className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
        </summary>
        <p className="mt-1 text-xs text-slate-500">{t("b.design.labelsHelp")}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {LABEL_KEYS.map((k) => (
            <Field key={k} label={t(`b.design.label.${k}`)}>
              <Input value={d.labels?.[k] ?? ""} onChange={(e) => setLabel(k, e.target.value)} placeholder={base[DEFAULT_KEY[k]]} maxLength={60} />
            </Field>
          ))}
        </div>
      </details>

      <div className="grid gap-2 sm:grid-cols-2">
        <Toggle checked={d.showSignature ?? true} onChange={(v) => set({ showSignature: v })} label={t("b.design.showSignature")} help={t("b.design.showSignatureHelp")} />
        <Toggle checked={d.showValidity ?? true} onChange={(v) => set({ showValidity: v })} label={t("b.design.showValidity")} help={t("b.design.showValidityHelp")} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
        <p className="text-xs text-slate-600">{t("b.design.saveHelp")}</p>
        <Button variant="secondary" size="sm" onClick={() => setSaveOpen(true)}>
          <Icon name="star" className="h-4 w-4" /> {t("b.design.saveTemplate")}
        </Button>
      </div>

      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title={t("b.design.saveTemplateTitle")}>
        <Field label={t("b.design.templateName")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("b.design.templateNamePh")} maxLength={60} autoFocus />
        </Field>
        <p className="mt-2 text-xs text-slate-500">{t("b.design.saveIncludes")}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setSaveOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              onSaveTemplate(name.trim());
              setSaveOpen(false);
              setName("");
            }}
          >
            {t("b.design.save")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
