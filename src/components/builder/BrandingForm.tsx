"use client";

import { useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/context";
import type { Branding } from "@/lib/quote";
import { Button, Field, Icon, cx } from "../ui";

const PRESETS = ["#1E3A8A", "#4F46E5", "#0F766E", "#B91C1C", "#9333EA", "#EA580C", "#0F172A", "#047857"];
const MAX_LOGO_BYTES = 500 * 1024;

export function BrandingForm({ branding, onChange }: { branding: Branding; onChange: (b: Branding) => void }) {
  const { t } = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

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
      <Field label={t("b.color")}>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ ...branding, color: c })}
              className={cx("h-7 w-7 rounded-full ring-2 ring-offset-2", branding.color.toUpperCase() === c ? "ring-slate-900" : "ring-transparent")}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
          <input type="color" value={branding.color} onChange={(e) => onChange({ ...branding, color: e.target.value.toUpperCase() })} className="h-8 w-10 cursor-pointer rounded border border-slate-300 bg-white" />
        </div>
      </Field>
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
