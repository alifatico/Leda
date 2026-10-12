"use client";

import { useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/context";
import { labelsFor, paletteFor, STYLE_IDS, STYLES, type DocLabels, type LabelOverrides, type Quote, type QuoteDesign, type StyleId } from "@/lib/quote";
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

/** A thumbnail of a document style, drawn from its tokens in the quote's own colours: header, client block, table, total. */
function StyleThumb({ id, color }: { id: StyleId; color: string }) {
  const tk = STYLES[id];
  const P = paletteFor(color);
  const rows = tk.layout === "dense" ? 5 : 3;
  const headerFill = tk.tableHeader === "filled";
  const table = (
    <span className="mx-1 mt-1.5 block space-y-[3px]">
      <span
        className={cx("block h-1.5 w-full", headerFill ? "rounded-[1px]" : "border-b")}
        style={headerFill ? { backgroundColor: P.accent } : { borderColor: tk.tableHeader === "double" ? P.ink : tk.layout === "swiss" ? P.ink : P.accent }}
      />
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} className="flex items-center justify-between" style={tk.zebra && i % 2 === 1 ? { backgroundColor: P.tint } : undefined}>
          <span className="flex items-center gap-[2px]">
            {tk.numbered ? <span className="block h-1 w-1 rounded-sm" style={{ backgroundColor: P.line }} /> : null}
            <span className="block h-1 w-5 rounded-sm bg-slate-200" />
          </span>
          <span className="block h-1 w-2 rounded-sm bg-slate-200" />
        </span>
      ))}
    </span>
  );
  const total = (
    <span
      className={cx("absolute bottom-1.5 right-1 block h-2 w-5", tk.radius ? "rounded-[2px]" : "", tk.payable === "outline" && "border", tk.payable === "rule" && "border-t-[1.5px]")}
      style={tk.payable === "filled" ? { backgroundColor: P.accent } : tk.payable === "panel" ? { backgroundColor: P.tint } : { borderColor: P.accent }}
    />
  );
  const frame = "relative block h-16 w-12 shrink-0 overflow-hidden rounded-[3px] border border-slate-200 bg-white shadow-sm";
  switch (tk.layout) {
    case "hero":
      return (
        <span aria-hidden className={frame}>
          <span className="flex h-4 w-full items-start justify-between px-1 pt-1" style={{ backgroundColor: P.accent }}>
            <span className="block h-1.5 w-1.5 rounded-[1px] bg-white/90" />
            <span className="block h-1.5 w-3 rounded-sm bg-white/90" />
          </span>
          <span className="mx-1 mt-1.5 flex gap-1">
            <span className="block h-2.5 flex-1" />
            <span className="block h-2.5 flex-1 rounded-[2px]" style={{ backgroundColor: P.tint }} />
          </span>
          {table}
          {total}
        </span>
      );
    case "swiss":
      return (
        <span aria-hidden className={frame}>
          <span className="flex items-center gap-[2px] px-1 pt-1.5">
            <span className="block h-1 w-1" style={{ backgroundColor: P.accent }} />
            <span className="block h-[3px] w-3 rounded-sm bg-slate-300" />
          </span>
          <span className="mx-1 mt-1 block h-1.5 w-8 rounded-sm bg-slate-700" />
          <span className="mx-1 mt-1.5 flex justify-between border-y py-[2px]" style={{ borderColor: P.ink }}>
            <span className="block h-1 w-2 rounded-sm bg-slate-200" />
            <span className="block h-1 w-2 rounded-sm bg-slate-200" />
            <span className="block h-1 w-2 rounded-sm bg-slate-200" />
          </span>
          {table}
          {total}
        </span>
      );
    case "masthead":
      return (
        <span aria-hidden className={frame}>
          <span className="mx-auto mt-1.5 block h-1 w-4 rounded-sm bg-slate-300" />
          <span className="mx-auto mt-1 block h-[2px] w-2" style={{ backgroundColor: P.accent }} />
          <span className="mx-auto mt-1 block h-1.5 w-6 rounded-sm" style={{ backgroundColor: P.deep }} />
          <span className="mx-1 mt-1.5 block h-[3px] border-y" style={{ borderColor: P.ink }} />
          {table}
          {total}
        </span>
      );
    case "dense":
      return (
        <span aria-hidden className={frame}>
          <span className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: P.accent }} />
          <span className="ml-2 mr-1 flex items-center justify-between pt-1.5">
            <span className="block h-1 w-3 rounded-sm bg-slate-300" />
            <span className="block h-1.5 w-3 rounded-sm" style={{ backgroundColor: P.accent }} />
          </span>
          <span className="ml-2 mr-1 mt-1 flex gap-1">
            <span className="block h-2 flex-1" />
            <span className="block h-2 flex-1" style={{ backgroundColor: P.tint }} />
          </span>
          <span className="ml-1">{table}</span>
          {total}
        </span>
      );
    case "sidebar":
      return (
        <span aria-hidden className={frame}>
          <span className="absolute inset-y-0 left-0 w-4 px-1 pt-1.5" style={{ backgroundColor: P.accent }}>
            <span className="block h-2 w-2 rounded-[1px] bg-white/90" />
            <span className="mt-1.5 block h-[2px] w-2 rounded-sm bg-white/70" />
            <span className="mt-[2px] block h-[2px] w-2 rounded-sm bg-white/70" />
          </span>
          <span className="ml-4 block">
            <span className="mx-1 mt-1.5 block h-2 w-5 rounded-sm bg-slate-700" />
            {table}
          </span>
          {total}
        </span>
      );
    default:
      return (
        <span aria-hidden className={frame}>
          <span className="flex items-start justify-between px-1 pt-1.5">
            <span className="block h-1 w-4 rounded-sm bg-slate-300" />
            <span className="block h-1.5 w-3 rounded-sm" style={{ backgroundColor: P.accent }} />
          </span>
          <span className="mx-1 mt-1 flex items-start">
            <span className="block h-[2px] w-2" style={{ backgroundColor: P.accent }} />
            <span className="mt-px block h-px flex-1" style={{ backgroundColor: P.line }} />
          </span>
          <span className="mx-1 mt-1 flex gap-1">
            <span className="block h-2.5 flex-1" />
            <span className="block h-2.5 flex-1 rounded-[1px] border-l-[2px]" style={{ backgroundColor: P.tint, borderColor: P.accent }} />
          </span>
          {table}
          {total}
        </span>
      );
  }
}

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
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-3">
          {STYLE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={style === id}
              onClick={() => set({ style: id })}
              className={cx(
                "pressable flex items-center gap-3 rounded-lg border p-2 text-left",
                style === id ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" : "border-slate-200 bg-white hover:border-slate-300",
              )}
            >
              <StyleThumb id={id} color={quote.branding.color} />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-900">{t(`b.design.styles.${id}`)}</span>
                <span className="block text-[11px] leading-snug text-slate-500">{t(`b.design.styleDesc.${id}`)}</span>
              </span>
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
        <div className="enter-rise grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
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
          <Icon name="chevron" className="h-4 w-4 text-slate-400 transition-transform duration-150 ease-out group-open:rotate-90" />
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
