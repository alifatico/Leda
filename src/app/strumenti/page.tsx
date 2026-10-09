import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Icon } from "@/components/ui";
import { appUrl, businessEnv } from "@/lib/env";

const TITLE = "Calcolatori fiscali gratis per preventivi e fatture";
const DESCRIPTION =
  "Calcolo ritenuta d'acconto, rivalsa INPS 4%, imposta di bollo da 2 euro: calcolatori gratuiti per professionisti e forfettari, che aprono il preventivo con i numeri già pronti.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${appUrl()}/strumenti` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
};

const tools = [
  { href: "/strumenti/calcolo-ritenuta-acconto", name: "Calcolo ritenuta d'acconto 20%", text: "Totale fattura, ritenuta e netto che incassi, con o senza rivalsa INPS. Quando si applica e quando no." },
  { href: "/strumenti/calcolo-rivalsa-inps", name: "Calcolo rivalsa INPS 4%", text: "Da compenso a totale, scorporo da un importo lordo, differenza con il contributo integrativo di cassa." },
  { href: "/strumenti/imposta-di-bollo-2-euro", name: "Imposta di bollo da 2 euro", text: "Quando è dovuta su fatture e ricevute senza IVA, chi la paga, diciture pronte." },
];

const guides = [
  { href: "/come-fare-un-preventivo", name: "Come fare un preventivo", text: "Cosa scrivere, come calcolare i totali, validità e accettazione, errori da evitare." },
  { href: "/preventivo-forfettario", name: "Preventivo in regime forfettario", text: "Niente IVA né ritenuta, rivalsa, bollo e le due diciture di legge." },
  { href: "/preventivo-prestazione-occasionale", name: "Preventivo senza partita IVA", text: "Prestazione occasionale: ritenuta 20%, bollo, diciture e ricevuta." },
];

export default function ToolsIndex() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Calcolatori fiscali per chi fa preventivi</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            Gli stessi calcoli del generatore di preventivi, liberi da usare: inserisci il compenso, scegli il regime e leggi totale, ritenuta e netto. Ogni calcolatore apre il
            preventivo con i numeri già dentro.
          </p>
          <h2 className="mt-10 text-xl font-semibold text-slate-900">Calcolatori</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {tools.map((x) => (
              <Link key={x.href} href={x.href} className="group rounded-2xl border border-slate-200 p-5 transition hover:border-indigo-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{x.name}</h3>
                  <Icon name="chevron" className="h-4 w-4 text-slate-300 transition group-hover:text-indigo-500" />
                </div>
                <p className="mt-2 text-sm text-slate-600">{x.text}</p>
              </Link>
            ))}
          </div>
          <h2 className="mt-10 text-xl font-semibold text-slate-900">Guide</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {guides.map((x) => (
              <Link key={x.href} href={x.href} className="group rounded-2xl border border-slate-200 p-5 transition hover:border-indigo-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{x.name}</h3>
                  <Icon name="chevron" className="h-4 w-4 text-slate-300 transition group-hover:text-indigo-500" />
                </div>
                <p className="mt-2 text-sm text-slate-600">{x.text}</p>
              </Link>
            ))}
          </div>
        </section>
        <section className="bg-slate-50 py-12">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Cerchi un modello per il tuo mestiere?</h2>
            <p className="max-w-2xl text-slate-600">Venti modelli precompilati, da web designer a impresa edile, con voci, prezzi e opzioni fiscali già impostati.</p>
            <Link href="/preventivo" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">
              <Icon name="bolt" className="h-5 w-5" /> Modelli per professione
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter supportEmail={businessEnv.supportEmail()} businessName={businessEnv.name()} />
    </div>
  );
}
