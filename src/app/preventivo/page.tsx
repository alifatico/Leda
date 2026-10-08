import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Icon } from "@/components/ui";
import { appUrl, businessEnv } from "@/lib/env";
import { professions } from "@/lib/professions";

export const metadata: Metadata = {
  title: "Modelli di preventivo per professione: gratis, in PDF, senza registrazione",
  description:
    "Modelli di preventivo precompilati per web designer, grafici, fotografi, consulenti, architetti, idraulici, elettricisti, imprese edili e altre professioni. Voci, prezzi e opzioni fiscali già impostati.",
  alternates: { canonical: `${appUrl()}/preventivo` },
};

export default function ProfessionsIndex() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Modelli di preventivo per professione</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            Ogni modello ha voci, prezzi di riferimento, note e condizioni di pagamento già scritti per il tuo mestiere, con le opzioni fiscali giuste (IVA, rivalsa, ritenuta,
            forfettario). Aprilo, cambia quello che vuoi e scarica il PDF.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {professions.map((p) => (
              <Link key={p.slug} href={`/preventivo/${p.slug}`} className="group rounded-2xl border border-slate-200 p-5 transition hover:border-indigo-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">{p.name}</h2>
                  <Icon name="chevron" className="h-4 w-4 text-slate-300 transition group-hover:text-indigo-500" />
                </div>
                <p className="mt-2 text-sm text-slate-600">{p.subject}</p>
                <p className="mt-3 text-xs text-slate-400">{p.items.length} voci precompilate</p>
              </Link>
            ))}
          </div>
        </section>
        <section className="bg-slate-50 py-12">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">La tua professione non c&apos;è?</h2>
            <p className="max-w-2xl text-slate-600">Descrivi il lavoro in una frase: l&apos;AI prepara voci e prezzi per qualunque attività. Gratis, senza registrazione.</p>
            <Link href="/preventivo-ai" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">
              <Icon name="sparkles" className="h-5 w-5" /> Preventivo con AI
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter supportEmail={businessEnv.supportEmail()} businessName={businessEnv.name()} />
    </div>
  );
}
