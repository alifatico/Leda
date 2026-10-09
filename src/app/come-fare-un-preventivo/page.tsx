import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/ContentPage";
import { QuotePreview } from "@/components/QuotePreview";
import { Icon } from "@/components/ui";
import { appUrl, businessEnv } from "@/lib/env";
import { sampleQuote } from "@/lib/quote";
import { breadcrumbJsonLd, faqJsonLd, type Faq } from "@/lib/seo";

const PATH = "/come-fare-un-preventivo";
const TITLE = "Come fare un preventivo: guida completa con esempio e modello";
const DESCRIPTION =
  "Cosa scrivere in un preventivo, come calcolare IVA, rivalsa, ritenuta e bollo, validità, acconto e accettazione, errori da evitare. Con esempio in PDF e modelli per professione, gratis.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${appUrl()}${PATH}` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article" },
};

const faq: Faq[] = [
  { q: "Il preventivo è vincolante?", a: "Finché non è accettato è una proposta, revocabile. Dopo l'accettazione scritta è un contratto: per questo ha una scadenza e condizioni chiare." },
  { q: "Posso modificare un preventivo già accettato?", a: "Solo con il consenso del cliente: emetti una nuova versione e fai accettare quella. Il link di questo sito tiene traccia delle revisioni." },
  { q: "Preventivo e fattura: che differenza c'è?", a: "Il preventivo è un'offerta, senza valore fiscale; la fattura (o la ricevuta) è il documento fiscale emesso a lavoro fatto. Il preventivo accettato è la base della fattura." },
  { q: "Quanto deve valere un preventivo?", a: "30 giorni è lo standard; 15 se i costi dei materiali oscillano, 60 per progetti che il cliente deve far approvare internamente." },
  { q: "Serve la firma del cliente?", a: "Non per forza: vale anche un'accettazione via email o un'accettazione online con nome, data e ora. La firma resta utile con i privati e per lavori di importo alto." },
  { q: "Devo mettere il bollo sul preventivo?", a: "No, il bollo riguarda fattura e ricevuta. Nel preventivo lo mostri solo per anticipare il totale finale." },
];

export default function Page() {
  const base = appUrl();
  const jsonLd = [faqJsonLd(faq), breadcrumbJsonLd([{ name: "Guide", url: `${base}/strumenti` }, { name: "Come fare un preventivo", url: `${base}${PATH}` }])];
  const sample = sampleQuote("it");
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ContentPage
        eyebrow={{ href: "/strumenti", label: "Guide e calcolatori" }}
        title="Come fare un preventivo: la guida con esempio e modello"
        intro={[
          "Un buon preventivo fa tre cose: dice chiaramente cosa farai e cosa no, mostra al cliente quanto pagherà davvero e lo porta a dire sì senza una seconda telefonata. Questa guida copre contenuti, calcoli fiscali, validità e accettazione, con un esempio in PDF e i modelli per professione.",
        ]}
        tool={
          <div className="grid items-start gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Un esempio concreto</h2>
              <p className="mt-2 text-slate-600">
                Dati di entrambe le parti, oggetto, tre voci con quantità e prezzo, totali con IVA, acconto del 30%, note su tempi ed esclusioni, condizioni di pagamento, validità e spazio per
                l&apos;accettazione. Scaricalo in PDF o aprilo nel generatore e cambia quello che vuoi.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/app" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700">
                  <Icon name="bolt" className="h-5 w-5" /> Fai il tuo preventivo
                </Link>
                <a href="/api/pdf/sample?lang=it" target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-800 hover:bg-slate-50">
                  <Icon name="download" className="h-5 w-5" /> Esempio in PDF
                </a>
              </div>
            </div>
            <div className="relative max-h-[560px] overflow-hidden rounded-xl shadow-2xl ring-1 ring-slate-200">
              <QuotePreview quote={sample} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
            </div>
          </div>
        }
        sections={[
          {
            h: "Cosa deve contenere un preventivo",
            list: [
              "I tuoi dati: nome o ragione sociale, indirizzo, partita IVA o codice fiscale, contatti; PEC e codice SDI se fatturerai elettronicamente.",
              "I dati del cliente, completi: senza, il preventivo non si trasforma in fattura.",
              "Numero e data: non obbligatori, ma ti permettono di richiamarlo (“come da preventivo n. 12”).",
              "Oggetto: una riga che riassume il lavoro.",
              "Le voci: descrizione, quantità, prezzo unitario, importo. Scomponi il lavoro in fasi che il cliente capisce.",
              "Cosa è escluso: la clausola che evita quasi tutte le discussioni a fine lavoro.",
              "Totali con IVA, rivalsa, ritenuta, bollo e netto a pagare, secondo il tuo regime.",
              "Tempi di consegna e condizioni di pagamento: acconto, saldo, scadenza, metodo.",
              "Validità: una data oltre la quale prezzi e condizioni non valgono più.",
              "Spazio per l'accettazione: firma, oppure un link per accettare online.",
            ],
          },
          {
            h: "Come si calcolano i totali",
            p: [
              "L'ordine conta: imponibile, poi rivalsa INPS o contributo di cassa (4%), poi IVA sull'imponibile più rivalsa, poi bollo se non c'è IVA, da cui il totale del documento. La ritenuta d'acconto si sottrae alla fine, sull'imponibile più la rivalsa INPS, e dà il netto a pagare. Su 1.000 € in regime ordinario con un cliente azienda: rivalsa 40, IVA 228,80, totale 1.268,80, ritenuta 208, netto 1.060,80 €.",
              "I calcolatori di questo sito fanno i conti e aprono il preventivo con i numeri già dentro.",
            ],
          },
          {
            h: "Il regime fiscale cambia il documento",
            list: [
              "Regime ordinario: IVA (22% per la maggior parte dei servizi), ritenuta 20% con i clienti sostituti d'imposta.",
              "Regime forfettario: niente IVA, niente ritenuta, bollo da 2 € sopra 77,47 €, due diciture di legge.",
              "Prestazione occasionale senza partita IVA: niente IVA, ritenuta 20%, bollo, dicitura dell'art. 5 DPR 633/72.",
            ],
          },
          {
            h: "Validità, acconto e condizioni di pagamento",
            p: [
              "Il preventivo è una proposta contrattuale: una volta accettato per iscritto vincola entrambi (art. 1326 c.c.). Per questo serve una scadenza, di solito 30 giorni, e per questo le condizioni vanno scritte prima. Un acconto del 30% alla conferma copre le prime ore di lavoro e seleziona i clienti davvero decisi; il saldo alla consegna, con bonifico a 30 giorni al massimo. Per i ritardi, gli interessi di mora del D.Lgs. 231/2002 si applicano tra imprese e professionisti anche senza scriverli, ma scriverli aiuta.",
            ],
          },
          {
            h: "Come inviarlo e farlo accettare",
            p: [
              "Il PDF via email resta lo standard: nome del file chiaro, oggetto esplicito, una riga di accompagnamento che richiama cosa vi siete detti a voce. Meglio ancora un link: il cliente apre il preventivo nel browser, lo scarica e lo accetta con nome e data; tu ricevi la notifica e hai una prova di accettazione con data e ora, senza inseguire firme scansionate.",
            ],
          },
          {
            h: "Gli errori che costano di più",
            list: [
              "Una voce unica (“sito web 2.500 €”): invita a trattare sul prezzo invece che sul contenuto.",
              "Niente esclusioni: ogni “ah, pensavo fosse compreso” lo paghi tu.",
              "Totale senza netto a pagare con i clienti azienda: la ritenuta arriva come una sorpresa.",
              "Prezzi “+ IVA” quando sei forfettario, o senza IVA quando non lo sei.",
              "Nessuna scadenza: il cliente torna dopo sei mesi con i prezzi vecchi.",
              "Revisioni illimitate: scrivi quante sono incluse e quanto costano le altre.",
            ],
          },
        ]}
        faq={faq}
        cta={{ href: "/app", label: "Crea il preventivo", text: "Fai il tuo preventivo adesso, gratis e senza registrazione" }}
        related={[
          { href: "/preventivo", label: "Modelli per professione" },
          { href: "/preventivo-forfettario", label: "Preventivo in regime forfettario" },
          { href: "/preventivo-prestazione-occasionale", label: "Preventivo senza partita IVA" },
          { href: "/strumenti/calcolo-ritenuta-acconto", label: "Calcolo ritenuta d'acconto" },
          { href: "/strumenti/calcolo-rivalsa-inps", label: "Calcolo rivalsa INPS 4%" },
          { href: "/preventivo-ai", label: "Preventivo con AI" },
        ]}
        supportEmail={businessEnv.supportEmail()}
        businessName={businessEnv.name()}
      />
    </>
  );
}
