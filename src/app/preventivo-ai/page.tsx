import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Icon } from "@/components/ui";
import { appUrl, businessEnv, getPricing } from "@/lib/env";

export const metadata: Metadata = {
  title: "Preventivo con intelligenza artificiale: gratis e senza registrazione",
  description:
    "Descrivi il lavoro in una frase e l'AI scrive voci, prezzi realistici, note e condizioni di pagamento. Controlli tutto, scarichi il PDF. Gratis, senza account, per qualunque professione.",
  alternates: { canonical: `${appUrl()}/preventivo-ai` },
};

const steps = [
  { t: "Descrivi il lavoro", x: "\"Sito web vetrina di 5 pagine per un ristorante, con logo e 12 mesi di manutenzione, budget intorno a 3.000 €\"." },
  { t: "L'AI prepara la bozza", x: "Oggetto, 2-10 voci con quantità, unità e prezzi di mercato, note su tempi ed esclusioni, condizioni di pagamento tipiche del settore." },
  { t: "Controlli e scarichi", x: "Modifichi quello che vuoi, attivi rivalsa, ritenuta o forfettario, e scarichi il PDF con il tuo logo." },
];

const faq = [
  { q: "L'AI è gratis?", a: "Sì, la bozza con AI è inclusa nel piano gratuito, senza registrazione. Paghi solo se vuoi il PDF pulito, senza filigrana." },
  { q: "I prezzi proposti sono affidabili?", a: "Sono stime di mercato per l'Italia, utili come punto di partenza. Il preventivo resta tuo: controlla sempre quantità e prezzi prima di inviarlo." },
  { q: "Cosa succede ai miei dati?", a: "La descrizione del lavoro viene inviata al modello linguistico per generare la bozza; non inviamo i dati del tuo cliente né i tuoi. I preventivi restano nel tuo browser." },
  { q: "Funziona per la mia professione?", a: "Per qualunque attività: da web designer e consulenti ad artigiani e imprese. Per molte professioni trovi anche un modello già pronto." },
];

export default function AiPage() {
  const pricing = getPricing();
  const singlePrice = new Intl.NumberFormat("it-IT", { style: "currency", currency: pricing.currency.toUpperCase() }).format(pricing.single / 100);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 pb-12 pt-14 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            <Icon name="sparkles" className="h-3.5 w-3.5" /> Gratis · Senza registrazione
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Preventivo con intelligenza artificiale</h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Una frase sul lavoro da fare e l&apos;AI scrive voci, prezzi, note e condizioni. Tu controlli, aggiusti e scarichi il PDF. Altri strumenti lo vendono da 12 a 19 € al
            mese: qui è incluso nel piano gratuito.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/app?ai=1" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700">
              <Icon name="sparkles" className="h-5 w-5" /> Prova la bozza con AI
            </Link>
            <Link href="/preventivo" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-medium text-slate-800 hover:bg-slate-50">
              Modelli per professione
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">PDF di prova gratis con filigrana. PDF pulito a {singlePrice} o illimitati con Pro.</p>
        </section>

        <section className="border-t border-slate-100 bg-slate-50 py-14">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.t} className="rounded-2xl border border-slate-200 bg-white p-6">
                <span className="text-sm font-semibold text-indigo-600">0{i + 1}</span>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">{s.t}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.x}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">Domande frequenti</h2>
            <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200">
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
          </div>
        </section>
      </main>
      <SiteFooter supportEmail={businessEnv.supportEmail()} businessName={businessEnv.name()} />
    </div>
  );
}
