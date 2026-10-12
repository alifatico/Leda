"use client";

import { useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/context";
import type { Branding } from "@/lib/quote";
import { Button, Field, Icon, Input, cx } from "../ui";

const PRESETS = [
  { hex: "#1E3A8A", key: "navy" },
  { hex: "#4F46E5", key: "indigo" },
  { hex: "#0F766E", key: "teal" },
  { hex: "#B91C1C", key: "red" },
  { hex: "#9333EA", key: "purple" },
  { hex: "#EA580C", key: "orange" },
  { hex: "#0F172A", key: "slate" },
  { hex: "#047857", key: "green" },
] as const;
const MAX_LOGO_BYTES = 500 * 1024;
const HEX = /^#[0-9A-F]{6}$/;
const WHEEL = "conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #06b6d4, #6366f1, #ec4899, #ef4444)";

/** Dark check mark on light swatches, white on dark ones. */
function isLight(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

export function BrandingForm({ branding, onChange }: { branding: Branding; onChange: (b: Branding) => void }) {
  const { t } = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const current = branding.color.toUpperCase();
  const preset = PRESETS.find((p) => p.hex === current);

  // the hex box follows the swatches and the picker; what is typed only lands when it is a full colour
  const [hexText, setHexText] = useState(current);
  const [lastColor, setLastColor] = useState(current);
  if (current !== lastColor) {
    setLastColor(current);
    setHexText(current);
  }
  const typeHex = (raw: string) => {
    setHexText(raw);
    const v = "#" + raw.trim().replace(/^#/, "").toUpperCase();
    if (HEX.test(v)) onChange({ ...branding, color: v });
  };

  const onFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!/^image\/(png|jpeg)$/.test(file.type) || file.size > MAX_LOGO_BYTES) {
      setError(t("b.logoTooBig"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange({ ...branding, logo: String(reader.result) });
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* not a <Field>: a label around several controls would open the colour picker on any click */}
      <div>
        <span className="mb-1 block text-xs font-medium text-slate-600">{t("b.color")}</span>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("b.color")}>
          {PRESETS.map((p) => {
            const selected = current === p.hex;
            return (
              <button
                key={p.hex}
                type="button"
                aria-label={t(`b.colorNames.${p.key}`)}
                title={t(`b.colorNames.${p.key}`)}
                aria-pressed={selected}
                onClick={() => onChange({ ...branding, color: p.hex })}
                className={cx("pressable flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-offset-2", selected ? "ring-slate-900" : "ring-transparent hover:ring-slate-300")}
                style={{ backgroundColor: p.hex }}
              >
                {selected ? <Icon name="check" className={cx("h-4 w-4", isLight(p.hex) ? "text-slate-900" : "text-white")} /> : null}
              </button>
            );
          })}
          {/* the colour wheel is the universal sign for "pick your own": the native picker sits inside the label */}
          <label
            className={cx("pressable relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full ring-2 ring-offset-2", preset ? "ring-transparent hover:ring-slate-300" : "ring-slate-900")}
            title={t("b.colorCustom")}
            style={{ background: WHEEL }}
          >
            <span className="absolute inset-[3px] rounded-full border-2 border-white" style={{ backgroundColor: current }} />
            <input
              type="color"
              value={current}
              onChange={(e) => onChange({ ...branding, color: e.target.value.toUpperCase() })}
              className="sr-only"
              aria-label={t("b.colorCustom")}
            />
          </label>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <label className="flex items-center gap-2">
            <span>{t("b.colorHex")}</span>
            <span className="block w-28">
              <Input value={hexText} onChange={(e) => typeHex(e.target.value)} onBlur={() => setHexText(current)} maxLength={7} spellCheck={false} className="font-mono uppercase" />
            </span>
          </label>
          <span>{preset ? t(`b.colorNames.${preset.key}`) : t("b.colorCustom")}</span>
        </div>
        <span className="mt-1 block text-xs text-slate-500">{t("b.colorHelp")}</span>
      </div>
      <Field label={t("b.logo")}>
        <div className="flex items-center gap-3">
          {branding.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logo} alt="" className="h-12 max-w-[120px] rounded border border-slate-200 bg-white object-contain p-1" />
          ) : null}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            <Icon name="file" className="h-4 w-4" /> {t("b.logoUpload")}
          </Button>
          {branding.logo ? (
            <Button variant="danger" size="sm" onClick={() => onChange({ ...branding, logo: undefined })}>
              {t("b.logoRemove")}
            </Button>
          ) : null}
        </div>
        {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
      </Field>
    </div>
  );
}
