import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { FiscalCalculator } from "@/components/tools/FiscalCalculator";
import { appUrl, businessEnv } from "@/lib/env";
import { breadcrumbJsonLd, faqJsonLd, type Faq } from "@/lib/seo";

const PATH = "/strumenti/calcolo-ritenuta-acconto";
const TITLE = "Calcolo ritenuta d'acconto 20%: totale fattura e netto a pagare";
const DESCRIPTION =
  "Calcolatore gratuito della ritenuta d'acconto del 20% per professionisti: compenso, rivalsa INPS, IVA, totale e netto che incassi. Poi genera il preventivo in PDF.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${appUrl()}${PATH}` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article" },
};

const faq: Faq[] = [
  { q: "La ritenuta d'acconto si calcola sull'IVA?", a: "No, mai. La base è il compenso più la rivalsa INPS 4%, se presente. L'IVA resta fuori: su 1.000 € di compenso con IVA 22% la ritenuta è 200 €, non 244 €." },
  { q: "Chi deve versare la ritenuta?", a: "Il cliente, in quanto sostituto d'imposta, con il modello F24 entro il 16 del mese successivo al pagamento. Tu non devi fare nulla, se non conservare fattura e Certificazione Unica." },
  { q: "Sono in regime forfettario: il cliente deve trattenerla?", a: "No. Riporta sul preventivo e sulla fattura la dicitura “compenso non soggetto a ritenuta d'acconto ai sensi dell'art. 1, comma 67, L. 190/2014”. Se il cliente la trattiene lo stesso la recuperi in dichiarazione, ma è una seccatura evitabile." },
  { q: "Il cliente ha trattenuto la ritenuta ma non l'ha versata: perdo i soldi?", a: "La ritenuta resta un tuo credito se dimostri di averla subita, con la fattura e la prova dell'incasso del netto (Agenzia delle Entrate, risoluzione 68/E/2009). L'omesso versamento è una violazione del cliente, non tua." },
  { q: "La rivalsa INPS entra nella ritenuta?", a: "Sì: la rivalsa INPS del 4% è parte del compenso, quindi la ritenuta si calcola su compenso più rivalsa. Il contributo integrativo di una cassa professionale invece no." },
  { q: "Quanto costa fare il preventivo con questi calcoli?", a: "Niente: il calcolatore e il preventivo di prova sono gratuiti e senza registrazione. Paghi solo se vuoi il PDF senza filigrana." },
];

export default function Page() {
  const base = appUrl();
  const jsonLd = [faqJsonLd(faq), breadcrumbJsonLd([{ name: "Strumenti", url: `${base}/strumenti` }, { name: "Calcolo ritenuta d'acconto", url: `${base}${PATH}` }])];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ContentPage
        eyebrow={{ href: "/strumenti", label: "Calcolatori fiscali" }}
        title="Calcolo ritenuta d'acconto 20%: totale fattura e netto a pagare"
        intro={[
          "La ritenuta d'acconto è un anticipo sulle tue imposte che il cliente trattiene dal compenso e versa all'Erario per conto tuo. Si applica ai professionisti con partita IVA in regime ordinario e alle prestazioni occasionali, quando il cliente è un sostituto d'imposta: un'azienda, un altro professionista, un ente. Con i clienti privati non si applica.",
          "Si calcola al 20% sul compenso più l'eventuale rivalsa INPS, mai sull'IVA. Il netto che incassi è il totale della fattura meno la ritenuta; l'importo trattenuto lo recuperi nella dichiarazione dei redditi come credito.",
        ]}
        tool={<FiscalCalculator title="Calcola ritenuta, totale e netto" initial={{ amount: 1000, vat: 22, regime: "ordinario", rivalsa: true, rivalsaKind: "inps", ritenuta: true, bollo: true }} />}
        sections={[
          {
            h: "Come si calcola: esempio su 1.000 euro",
            p: [
              "Compenso 1.000 €, rivalsa INPS 4% 40 €, imponibile 1.040 €. IVA 22% su 1.040 € = 228,80 €, totale fattura 1.268,80 €. Ritenuta 20% su 1.040 € = 208 €. Netto a pagare 1.060,80 €: è quello che arriva sul tuo conto.",
              "Se il 4% è il contributo integrativo di una cassa professionale (Inarcassa, Cassa Forense, ENPAP, EPPI…) la ritenuta si calcola solo sul compenso: 200 € invece di 208 €, netto 1.068,80 €. Il calcolatore qui sopra distingue i due casi.",
            ],
          },
          {
            h: "Quando non si applica",
            list: [
              "Regime forfettario: il compenso non è soggetto a ritenuta (art. 1, comma 67, L. 190/2014). Scrivi la dicitura sul documento, altrimenti qualche ufficio amministrativo la trattiene per abitudine.",
              "Cliente privato senza partita IVA: non è sostituto d'imposta, paga il totale.",
              "Cliente estero senza stabile organizzazione in Italia: non opera ritenute italiane.",
              "Spese anticipate in nome e per conto del cliente, documentate (art. 15 DPR 633/72): fuori da IVA e ritenuta.",
            ],
          },
          {
            h: "Perché mostrarla nel preventivo",
            p: [
              "Il preventivo che dice solo “1.268,80 € IVA inclusa” genera la telefonata classica: “ma io ho pagato 1.060”. Mettere la riga della ritenuta e il netto a pagare chiude la discussione prima che nasca e fa capire al cliente che sta anticipando una tua imposta, non pagandoti di meno. Il PDF di questo sito stampa totale, ritenuta e netto a pagare in automatico.",
            ],
          },
          {
            h: "Cosa fa il cliente con la ritenuta",
            p: [
              "La versa con il modello F24 entro il 16 del mese successivo al pagamento (codice tributo 1040) e l'anno dopo ti consegna la Certificazione Unica, che riporta compensi e ritenute. Tu la indichi in dichiarazione e la scomputi dall'imposta dovuta: se hai anticipato più del dovuto, la differenza va a credito.",
            ],
          },
          {
            h: "Ritenuta sulle prestazioni occasionali",
            p: [
              "Anche chi lavora senza partita IVA subisce la ritenuta del 20% sul compenso, se il committente è un sostituto d'imposta. Niente IVA, bollo da 2 € sopra 77,47 €, ricevuta invece di fattura: il modello dedicato imposta tutto da solo.",
            ],
          },
        ]}
        faq={faq}
        cta={{ href: "/app?regime=ordinario&ritenuta=20&rivalsa=4&vat=22", label: "Crea il preventivo", text: "Il preventivo con ritenuta e netto a pagare, pronto in 60 secondi" }}
        related={[
          { href: "/strumenti/calcolo-rivalsa-inps", label: "Calcolo rivalsa INPS 4%" },
          { href: "/preventivo-forfettario", label: "Preventivo in regime forfettario" },
          { href: "/preventivo-prestazione-occasionale", label: "Preventivo senza partita IVA" },
          { href: "/strumenti/imposta-di-bollo-2-euro", label: "Imposta di bollo da 2 euro" },
          { href: "/come-fare-un-preventivo", label: "Come fare un preventivo" },
          { href: "/preventivo", label: "Modelli per professione" },
        ]}
        supportEmail={businessEnv.supportEmail()}
        businessName={businessEnv.name()}
      />
    </>
  );
}
