"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/context";
import { sampleQuote, type StyleId } from "@/lib/quote";
import { QuotePreview } from "./QuotePreview";
import { StyleThumb } from "./StyleThumb";
import { cx } from "./ui";

/** Brand colours on offer in the hero: the label key and the hex. */
const COLORS = [
  ["navy", "#1E3A8A"],
  ["teal", "#0F766E"],
  ["terracotta", "#C2410C"],
  ["plum", "#6D28D9"],
  ["ink", "#111827"],
] as const;

/** The order the hero cycles through: the boldest looks first. */
const ORDER: StyleId[] = ["moderno", "studio", "elegante", "essenziale", "classico", "compatto"];
const AUTO_MS = 4500;

/**
 * The landing hero: the sample quote in each of the six styles and five
 * brand colours, cycling on its own until the visitor picks one. Shows what
 * the editor does rather than a single static page.
 */
export function HeroShowcase() {
  const { t, locale } = useLocale();
  const [style, setStyle] = useState<StyleId>(ORDER[0]);
  const [color, setColor] = useState<string>(COLORS[0][1]);
  const [picked, setPicked] = useState(false);
  const [hover, setHover] = useState(false);

  // Cycle through the styles until the visitor picks one, pauses with the mouse or asks for less motion.
  useEffect(() => {
    if (picked || hover) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setStyle((s) => ORDER[(ORDER.indexOf(s) + 1) % ORDER.length]), AUTO_MS);
    return () => window.clearInterval(id);
  }, [picked, hover]);

  const base = sampleQuote(locale);
  const quote = { ...base, design: { ...base.design, style }, branding: { ...base.branding, color } };
  const pick = (next: Partial<{ style: StyleId; color: string }>) => {
    if (next.style) setStyle(next.style);
    if (next.color) setColor(next.color);
    setPicked(true);
  };

  return (
    <div className="relative isolate mx-auto w-full max-w-[560px]" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="pointer-events-none absolute -inset-6 -z-20 rounded-3xl bg-gradient-to-br from-indigo-200/60 via-amber-100/40 to-transparent blur-2xl" />

      <div className="mb-3 flex flex-wrap items-center gap-1.5" role="group" aria-label={t("hero.pickStyle")}>
        {ORDER.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={style === id}
            onClick={() => pick({ style: id })}
            className={cx(
              "pressable flex items-center gap-1 rounded-lg border py-0.5 pl-0.5 pr-2 text-[11px] font-medium",
              style === id ? "border-indigo-500 bg-white text-slate-900 shadow-sm ring-1 ring-indigo-500" : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-white",
            )}
          >
            <span className="[zoom:0.42]">
              <StyleThumb id={id} color={color} />
            </span>
            {t(`b.design.styles.${id}`)}
          </button>
        ))}
      </div>

      <div className="relative">
        {/* two sheets peeking out behind the document: the pile of quotes a studio sends out */}
        <div aria-hidden className="absolute inset-x-8 -bottom-2.5 top-6 -z-10 -rotate-2 rounded-xl bg-white shadow-xl ring-1 ring-slate-200" />
        <div aria-hidden className="absolute inset-x-4 -bottom-1 top-3 -z-10 rotate-1 rounded-xl bg-white shadow-lg ring-1 ring-slate-200" />
        <div className="relative max-h-[560px] overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200">
          <div key={`${style}-${color}`} className="enter-fade">
            <QuotePreview quote={quote} />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5" role="group" aria-label={t("hero.pickColor")}>
          {COLORS.map(([name, hex]) => (
            <button
              key={hex}
              type="button"
              aria-label={t(`hero.colors.${name}`)}
              aria-pressed={color === hex}
              onClick={() => pick({ color: hex })}
              className={cx("pressable h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-white", color === hex ? "ring-slate-900" : "ring-transparent hover:ring-slate-300")}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        <p className="text-xs text-slate-500">{t("hero.showcaseHint")}</p>
      </div>
    </div>
  );
}
