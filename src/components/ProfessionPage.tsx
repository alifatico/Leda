import Link from "next/link";
import { professions, sampleQuoteFor, type Profession } from "@/lib/professions";
import { QuotePreview } from "./QuotePreview";
import { SiteFooter, SiteHeader } from "./SiteChrome";
import { Icon } from "./ui";

/** Static, Italian-only SEO page for one profession (server component). */
export function ProfessionPage({ p, supportEmail, businessName, singlePrice }: { p: Profession; supportEmail: string; businessName: string; singlePrice: string }) {
  const sample = sampleQuoteFor(p);
  const related = professions.filter((x) => x.slug !== p.slug).slice(0, 8);
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-start gap-10 px-4 pb-12 pt-12 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              <Link href="/preventivo" className="hover:underline">
                Modelli di preventivo
              </Link>{" "}
              / {p.name}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">{p.title}</h1>
            {p.intro.map((para, i) => (
              <p key={i} className="mt-4 text-lg leading-relaxed text-slate-600">
                {para}
              </p>
            ))}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={`/app?template=${p.slug}`} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700">
                <Icon name="bolt" className="h-5 w-5" /> Usa questo modello gratis
              </Link>
              <a href={`/api/pdf/sample?template=${p.slug}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-medium text-slate-800 hover:bg-slate-50">
                <Icon name="file" className="h-5 w-5" /> Vedi l&apos;esempio in PDF
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-500">Senza registrazione. Modifichi voci e prezzi, scarichi la prova gratis; il PDF pulito costa {singlePrice}, oppure Pro per preventivi illimitati.</p>
          </div>
          <div className="relative mx-auto w-full max-w-[560px]">
            <div className="relative max-h-[640px] overflow-hidden rounded-xl shadow-2xl ring-1 ring-slate-200">
              <QuotePreview quote={sample} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
            </div>
          </div>
        </section>

        <section className="border-t border-slate-100 bg-slate-50 py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Le voci del preventivo per {p.who}</h2>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Voce</th>
                    <th className="px-4 py-3 text-right">Quantità</th>
                    <th className="px-4 py-3 text-right">Prezzo unitario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {p.items.map((it) => (
                    <tr key={it.description}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{it.description}</div>
                        {it.details ? <div className="text-xs text-slate-500">{it.details}</div> : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                        {new Intl.NumberFormat("it-IT").format(it.quantity)} {it.unit}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">{new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(it.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-500">Prezzi indicativi del mercato italiano, IVA esclusa. Modificali in base alla tua esperienza e alla zona.</p>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tre cose da non dimenticare</h2>
              <ul className="mt-5 space-y-3">
                {p.tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-3 text-slate-700">
                    <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> {tip}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Domande frequenti</h2>
              <div className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200">
                {p.faq.map((f) => (
                  <details key={f.q} className="group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-slate-900">
                      {f.q}
                      <Icon name="chevron" className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-indigo-600 py-12 text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">Il tuo preventivo da {p.name.toLowerCase()} in 60 secondi</h2>
            <Link href={`/app?template=${p.slug}`} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-base font-semibold text-slate-900 shadow-lg hover:bg-amber-300">
              <Icon name="bolt" className="h-5 w-5" /> Parti dal modello
            </Link>
          </div>
        </section>

        <section className="py-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-lg font-semibold text-slate-900">Altri modelli di preventivo</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {related.map((r) => (
                <Link key={r.slug} href={`/preventivo/${r.slug}`} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:border-indigo-300 hover:text-indigo-700">
                  {r.name}
                </Link>
              ))}
              <Link href="/preventivo" className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:border-indigo-300">
                Tutti i modelli
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter supportEmail={supportEmail} businessName={businessName} />
    </div>
  );
}
