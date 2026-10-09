import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { FiscalCalculator } from "@/components/tools/FiscalCalculator";
import { appUrl, businessEnv } from "@/lib/env";
import { breadcrumbJsonLd, faqJsonLd, type Faq } from "@/lib/seo";

const PATH = "/preventivo-prestazione-occasionale";
const TITLE = "Preventivo per prestazione occasionale senza partita IVA";
const DESCRIPTION =
  "Come fare un preventivo per una prestazione occasionale senza partita IVA: niente IVA, ritenuta d'acconto 20%, bollo da 2 € e diciture corrette. Calcolatore e modello PDF gratis.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${appUrl()}${PATH}` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article" },
};

const faq: Faq[] = [
  { q: "Quante prestazioni occasionali posso fare in un anno?", a: "La legge non fissa un numero: conta l'abitualità. Lavori diversi, per clienti diversi, senza continuità, restano occasionali; lo stesso lavoro ogni mese per lo stesso cliente no." },
  { q: "Devo applicare la ritenuta se il cliente è un privato?", a: "No. La ritenuta la opera solo un sostituto d'imposta: azienda, professionista, ente, condominio. Con un privato incassi il totale." },
  { q: "Posso aggiungere la rivalsa INPS 4%?", a: "No: è riservata ai professionisti con partita IVA iscritti alla Gestione Separata." },
  { q: "Serve il codice fiscale del cliente?", a: "Sì, su ricevuta e preventivo vanno i dati completi di entrambi: nome, indirizzo e codice fiscale o partita IVA." },
  { q: "Posso fare prestazioni occasionali se sono dipendente o studente?", a: "In genere sì. Se sei dipendente controlla il contratto (clausole di esclusiva o di non concorrenza) e, nel pubblico impiego, chiedi l'autorizzazione all'amministrazione." },
  { q: "La ricevuta va numerata e conservata?", a: "Numerarla non è obbligatorio ma aiuta; conserva ricevute e Certificazioni Uniche per la dichiarazione dei redditi e per eventuali controlli." },
];

export default function Page() {
  const base = appUrl();
  const jsonLd = [faqJsonLd(faq), breadcrumbJsonLd([{ name: "Guide", url: `${base}/strumenti` }, { name: "Preventivo per prestazione occasionale", url: `${base}${PATH}` }])];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ContentPage
        eyebrow={{ href: "/strumenti", label: "Guide e calcolatori" }}
        title="Preventivo per prestazione occasionale, senza partita IVA"
        intro={[
          "Puoi fare un preventivo anche senza partita IVA, se il lavoro è davvero occasionale: non abituale, senza organizzazione di mezzi, senza vincolo di subordinazione (art. 2222 c.c.). Il compenso rientra nei redditi diversi (art. 67, comma 1, lettera l, del TUIR): niente IVA, ritenuta d'acconto del 20% se il cliente è un sostituto d'imposta, imposta di bollo da 2 euro sopra 77,47 euro.",
          "Il preventivo serve a fissare prezzo e condizioni prima di iniziare; a lavoro finito emetterai una ricevuta, non una fattura.",
        ]}
        tool={<FiscalCalculator title="Calcola ritenuta, bollo e netto della prestazione occasionale" show={{ regime: false, vat: false, rivalsa: false }} initial={{ amount: 500, vat: 0, regime: "occasionale", rivalsa: false, rivalsaKind: "inps", ritenuta: true, bollo: true }} />}
        sections={[
          {
            h: "Quando una prestazione è davvero occasionale",
            list: [
              "Non è abituale: un lavoro ogni tanto, non la tua attività ricorrente. Ripetere la stessa prestazione per lo stesso cliente ogni mese è abitualità, anche con importi piccoli.",
              "Non c'è organizzazione: niente studio, dipendenti, pubblicità, sito con listino.",
              "Decidi tu tempi e modi: nessun orario imposto, nessun capo.",
              "Il limite di 5.000 € l'anno non riguarda la possibilità di lavorare: è la soglia oltre la quale scattano i contributi INPS Gestione Separata sulla parte eccedente, per un terzo a tuo carico e due terzi del committente.",
              "Non confonderla con il “contratto di prestazione occasionale” INPS (ex voucher), che è un rapporto gestito dal committente sulla piattaforma INPS.",
            ],
          },
          {
            h: "Il calcolo con un esempio",
            p: [
              "Compenso 500 € per un cliente azienda: ritenuta 20% 100 €, bollo 2 € addebitato, totale documento 502 €, netto che incassi 402 €. I 100 € trattenuti li recuperi nella dichiarazione dei redditi. Con un cliente privato niente ritenuta: incassi 502 €, o 500 € se il bollo lo assorbi tu.",
            ],
          },
          {
            h: "Le diciture per preventivo e ricevuta",
            quotes: [
              "Prestazione di lavoro autonomo occasionale ai sensi dell'art. 2222 c.c.",
              "Operazione non soggetta a IVA per mancanza del presupposto soggettivo ai sensi dell'art. 5 del DPR 633/1972.",
              "Compenso soggetto a ritenuta d'acconto del 20% ai sensi dell'art. 25 del DPR 600/1973 (solo se il committente è sostituto d'imposta).",
              "Imposta di bollo da 2,00 € assolta sull'originale (art. 13 Tariffa DPR 642/1972).",
            ],
          },
          {
            h: "Dopo il preventivo: la ricevuta",
            p: [
              "A fine lavoro la ricevuta riporta i tuoi dati con codice fiscale, quelli del cliente, data, descrizione, compenso, ritenuta e netto, bollo e firma. Il cliente azienda versa la ritenuta e l'anno dopo ti consegna la Certificazione Unica; tu dichiari il compenso nel quadro RL del modello Redditi o nel quadro D del 730.",
            ],
          },
          {
            h: "Quando serve invece la partita IVA",
            p: [
              "Quando la prestazione diventa abituale: stessa attività ripetuta nel tempo, più clienti, pubblicità. Non esiste una soglia di importo che la faccia scattare, anche se i 5.000 € vengono spesso usati come riferimento pratico. Se prevedi di continuare, il regime forfettario costa poco e ti mette in regola.",
            ],
          },
        ]}
        faq={faq}
        cta={{ href: "/app?regime=occasionale&ritenuta=20", label: "Crea il preventivo", text: "Preventivo senza partita IVA, con ritenuta e bollo già calcolati" }}
        related={[
          { href: "/strumenti/calcolo-ritenuta-acconto", label: "Calcolo ritenuta d'acconto" },
          { href: "/strumenti/imposta-di-bollo-2-euro", label: "Imposta di bollo da 2 euro" },
          { href: "/preventivo-forfettario", label: "Preventivo in regime forfettario" },
          { href: "/come-fare-un-preventivo", label: "Come fare un preventivo" },
          { href: "/preventivo", label: "Modelli per professione" },
        ]}
        supportEmail={businessEnv.supportEmail()}
        businessName={businessEnv.name()}
      />
    </>
  );
}
