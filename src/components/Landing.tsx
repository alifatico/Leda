"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, formatPrice } from "@/lib/client-api";
import type { PlanId, PublicConfig } from "@/lib/env";
import { useLocale } from "@/lib/i18n/context";
import { sampleQuote } from "@/lib/quote";
import { QuotePreview } from "./QuotePreview";
import { SiteFooter, SiteHeader } from "./SiteChrome";
import { Button, Icon, cx } from "./ui";

export function Landing({ config, businessName }: { config: PublicConfig; businessName: string }) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const p = config.pricing;
  const price = (c: number) => formatPrice(c, p.currency, locale);
  const [interval, setInterval] = useState<"monthly" | "yearly">("yearly");
  const [busy, setBusy] = useState<PlanId | null>(null);
  const yearlySave = Math.round((1 - p.proYearly / (p.proMonthly * 12)) * 100);

  const goPro = async () => {
    const plan: PlanId = interval === "monthly" ? "pro_monthly" : "pro_yearly";
    if (!config.payments) {
      router.push("/app?plan=pro");
      return;
    }
    setBusy(plan);
    try {
      const { url } = await api.checkout(plan, undefined, locale);
      window.location.href = url;
    } catch {
      router.push("/app?plan=pro");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(79,70,229,0.12),transparent)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              <Icon name="shield" className="h-3.5 w-3.5" /> {t("hero.badge")}
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{t("hero.title")}</h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">{t("hero.subtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/app" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700">
                <Icon name="bolt" className="h-5 w-5" /> {t("hero.cta")}
              </Link>
              <a href={`/api/pdf/sample?lang=${locale}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-medium text-slate-800 hover:bg-slate-50">
                <Icon name="file" className="h-5 w-5" /> {t("hero.ctaSecondary")}
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-500">{t("hero.note", { single: price(p.single) })}</p>
            <ul className="mt-8 grid grid-cols-2 gap-3 text-sm text-slate-700 sm:grid-cols-4">
              {(["one", "two", "three", "four"] as const).map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <Icon name="check" className="h-4 w-4 text-emerald-600" /> {t(`trust.${k}`)}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-[560px]">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-indigo-200/60 via-amber-100/40 to-transparent blur-2xl" />
            <div className="relative max-h-[560px] overflow-hidden rounded-xl shadow-2xl ring-1 ring-slate-200">
              <QuotePreview quote={sampleQuote(locale)} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="border-t border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">{t("how.title")}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {([
              ["s1", "sparkles"],
              ["s2", "calc"],
              ["s3", "download"],
            ] as const).map(([k, icon], i) => (
              <div key={k} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                    <Icon name={icon} className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-indigo-600">0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{t(`how.${k}t`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(`how.${k}x`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">{t("features.title")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">{t("features.subtitle")}</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {([
              ["f1", "calc"],
              ["f2", "shield"],
              ["f3", "sparkles"],
              ["f4", "star"],
              ["f5", "lock"],
              ["f6", "globe"],
            ] as const).map(([k, icon]) => (
              <div key={k} className="rounded-2xl border border-slate-200 p-5">
                <Icon name={icon} className="h-6 w-6 text-indigo-600" />
                <h3 className="mt-3 font-semibold text-slate-900">{t(`features.${k}t`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{t(`features.${k}x`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-t border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">{t("pricing.title")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">{t("pricing.subtitle")}</p>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <PriceCard name={t("pricing.freeName")} desc={t("pricing.freeDesc")} price={price(0)} suffix="" bullets={[t("pricing.free1"), t("pricing.free2"), t("pricing.free3")]}>
              <Link href="/app" className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-800 hover:bg-slate-50">
                {t("pricing.freeCta")}
              </Link>
            </PriceCard>
            <PriceCard name={t("pricing.singleName")} desc={t("pricing.singleDesc")} price={price(p.single)} suffix={t("pricing.perDoc")} bullets={[t("pricing.single1"), t("pricing.single2"), t("pricing.single3")]}>
              <Link href="/app" className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-800 hover:bg-slate-50">
                {t("pricing.singleCta")}
              </Link>
            </PriceCard>
            <PriceCard
              highlight
              name={t("pricing.proName")}
              desc={t("pricing.proDesc")}
              price={price(interval === "monthly" ? p.proMonthly : p.proYearly)}
              suffix={interval === "monthly" ? t("pricing.perMonth") : t("pricing.perYear")}
              bullets={[t("pricing.pro1"), t("pricing.pro2"), t("pricing.pro3"), t("pricing.pro4")]}
              toggle={
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
                  {(["monthly", "yearly"] as const).map((i) => (
                    <button key={i} onClick={() => setInterval(i)} className={cx("rounded-md px-2.5 py-1", interval === i ? "bg-white text-slate-900 shadow-sm" : "text-slate-600")}>
                      {i === "monthly" ? t("pricing.monthly") : `${t("pricing.yearly")} · ${t("pricing.yearlySave", { pct: yearlySave })}`}
                    </button>
                  ))}
                </div>
              }
            >
              <Button className="mt-6 w-full" size="lg" onClick={goPro} loading={busy !== null}>
                <Icon name="bolt" className="h-5 w-5" /> {t("pricing.proCta")}
              </Button>
            </PriceCard>
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">{t("pricing.vatNote")}</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">{t("faq.title")}</h2>
          <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200">
            {([1, 2, 3, 4, 5, 6, 7, 8] as const).map((n) => (
              <details key={n} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-slate-900">
                  {t(`faq.q${n}`)}
                  <Icon name="chevron" className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{t(`faq.a${n}`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-14 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">{t("hero.title")}</h2>
          <Link href="/app" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-base font-semibold text-slate-900 shadow-lg hover:bg-amber-300">
            <Icon name="bolt" className="h-5 w-5" /> {t("hero.cta")}
          </Link>
        </div>
      </section>

      <SiteFooter supportEmail={config.supportEmail} businessName={businessName} />
    </div>
  );
}

function PriceCard({
  name,
  desc,
  price,
  suffix,
  bullets,
  children,
  highlight,
  toggle,
}: {
  name: string;
  desc: string;
  price: string;
  suffix: string;
  bullets: string[];
  children: React.ReactNode;
  highlight?: boolean;
  toggle?: React.ReactNode;
}) {
  const { t } = useLocale();
  return (
    <div className={cx("relative flex flex-col rounded-2xl bg-white p-6 shadow-sm", highlight ? "border-2 border-indigo-600 shadow-indigo-600/10" : "border border-slate-200")}>
      {highlight ? <span className="absolute -top-3 left-6 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">{t("pricing.popular")}</span> : null}
      <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-slate-900">{price}</span>
        <span className="text-sm text-slate-500">{suffix}</span>
      </div>
      {toggle ? <div className="mt-3">{toggle}</div> : null}
      <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-700">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {b}
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}
