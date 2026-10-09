import Link from "next/link";
import type { ReactNode } from "react";
import type { Faq } from "@/lib/seo";
import { SiteFooter, SiteHeader } from "./SiteChrome";
import { Icon } from "./ui";

export type ContentSection = { h: string; p?: string[]; list?: string[]; quotes?: string[] };
export type RelatedLink = { href: string; label: string };

/** Layout shared by the guides and calculator pages (server component, Italian only). */
export function ContentPage({
  eyebrow,
  title,
  intro,
  tool,
  sections,
  faq,
  cta,
  related,
  supportEmail,
  businessName,
  reviewed = "ottobre 2026",
}: {
  eyebrow: RelatedLink;
  title: string;
  intro: string[];
  tool?: ReactNode;
  sections: ContentSection[];
  faq: Faq[];
  cta: { href: string; label: string; text: string };
  related: RelatedLink[];
  supportEmail: string;
  businessName: string;
  reviewed?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 pb-8 pt-12 sm:px-6">
          <p className="text-sm font-medium text-indigo-600">
            <Link href={eyebrow.href} className="hover:underline">
              {eyebrow.label}
            </Link>
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">{title}</h1>
          {intro.map((para, i) => (
            <p key={i} className="mt-4 text-lg leading-relaxed text-slate-600">
              {para}
            </p>
          ))}
        </section>

        {tool ? (
          <section className="border-y border-slate-100 bg-slate-50 py-10">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">{tool}</div>
          </section>
        ) : null}

        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          {sections.map((sec) => (
            <section key={sec.h} className="mb-10">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">{sec.h}</h2>
              {sec.p?.map((para, i) => (
                <p key={i} className="mt-3 leading-relaxed text-slate-700">
                  {para}
                </p>
              ))}
              {sec.list ? (
                <ul className="mt-3 space-y-2">
                  {sec.list.map((li) => (
                    <li key={li} className="flex items-start gap-3 text-slate-700">
                      <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{li}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {sec.quotes?.map((q) => (
                <blockquote key={q} className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                  {q}
                </blockquote>
              ))}
            </section>
          ))}

          <section className="mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Domande frequenti</h2>
            <div className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {faq.map((f) => (
                <details key={f.q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-slate-900">
                    {f.q}
                    <Icon name="chevron" className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <p className="text-xs text-slate-400">Aggiornato a {reviewed}. Informazioni generali, non consulenza fiscale: per il tuo caso specifico chiedi al commercialista.</p>
        </article>

        <section className="bg-indigo-600 py-12 text-white">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">{cta.text}</h2>
            <Link href={cta.href} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-base font-semibold text-slate-900 shadow-lg hover:bg-amber-300">
              <Icon name="bolt" className="h-5 w-5" /> {cta.label}
            </Link>
            <p className="text-sm text-indigo-100">Gratis, senza registrazione. PDF di prova subito, PDF pulito a pochi euro.</p>
          </div>
        </section>

        <section className="py-10">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-lg font-semibold text-slate-900">Leggi anche</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {related.map((r) => (
                <Link key={r.href} href={r.href} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:border-indigo-300 hover:text-indigo-700">
                  {r.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter supportEmail={supportEmail} businessName={businessName} />
    </div>
  );
}
