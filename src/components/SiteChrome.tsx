"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useLocale } from "@/lib/i18n/context";
import { LocaleSwitch } from "./LocaleSwitch";
import { Icon } from "./ui";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={"inline-flex items-center gap-2 font-semibold tracking-tight text-slate-900 " + className}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-amber-300 shadow-sm shadow-indigo-600/30">
        <Icon name="bolt" className="h-5 w-5" />
      </span>
      <span>
        Preventivo <span className="text-indigo-600">Lampo</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const { t } = useLocale();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/#how" className="hover:text-slate-900">
            {t("nav.how")}
          </Link>
          <Link href="/#pricing" className="hover:text-slate-900">
            {t("nav.pricing")}
          </Link>
          <Link href="/#faq" className="hover:text-slate-900">
            {t("nav.faq")}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LocaleSwitch />
          <Link href="/app" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
            <Icon name="bolt" className="h-4 w-4" />
            {t("nav.app")}
          </Link>
        </div>
      </div>
    </header>
  );
}

const subscribeNever = () => () => {};
const LAUNCH_YEAR = 2026;

export function SiteFooter({ supportEmail, businessName }: { supportEmail: string; businessName: string }) {
  const { t } = useLocale();
  // The prerendered HTML carries a fixed year; the browser shows the real one after hydration.
  const year = useSyncExternalStore(subscribeNever, () => new Date().getFullYear(), () => LAUNCH_YEAR);
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
        <div>
          <Logo />
          <p className="mt-2 text-sm text-slate-500">{t("footer.tagline")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
          <Link href="/preventivo" className="hover:text-slate-900">
            {t("footer.templates")}
          </Link>
          <Link href="/preventivo-ai" className="hover:text-slate-900">
            {t("footer.ai")}
          </Link>
          <Link href="/privacy" className="hover:text-slate-900">
            {t("footer.privacy")}
          </Link>
          <Link href="/termini" className="hover:text-slate-900">
            {t("footer.terms")}
          </Link>
          <a href={`mailto:${supportEmail}`} className="hover:text-slate-900">
            {t("footer.contact")}
          </a>
          <span className="text-slate-400">
            © {year} {businessName} · {t("footer.made")}
          </span>
        </div>
      </div>
    </footer>
  );
}
