"use client";

import { useLocale } from "@/lib/i18n/context";
import { cx } from "./ui";

export function LocaleSwitch({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  return (
    <div className={cx("inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium", className)} role="group" aria-label="Language">
      {(["it", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={cx("rounded-md px-2 py-1 uppercase", locale === l ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}
          aria-pressed={locale === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
