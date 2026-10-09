import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { FiscalCalculator } from "@/components/tools/FiscalCalculator";
import { appUrl, businessEnv } from "@/lib/env";
import { breadcrumbJsonLd, faqJsonLd, type Faq } from "@/lib/seo";

const PATH = "/preventivo-forfettario";
const TITLE = "Preventivo in regime forfettario: diciture, calcolo e modello";
const DESCRIPTION =
  "Come fare un preventivo in regime forfettario: senza IVA e senza ritenuta, con rivalsa INPS 4% e bollo da 2 €. Diciture di legge, esempio di calcolo e modello PDF gratis, senza registrazione.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${appUrl()}${PATH}` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article" },
};

const faq: Faq[] = [
  { q: "Devo scrivere IVA 0% nel preventivo?", a: "Meglio di no: 0% suggerisce un'operazione IVA ad aliquota zero. Scrivi “importi non soggetti a IVA” con la dicitura del regime forfettario, come fa il modello." },
  { q: "Posso applicare la rivalsa INPS 4% in forfettario?", a: "Sì, se sei iscritto alla Gestione Separata. Se sei iscritto a una cassa professionale applichi invece il contributo integrativo della cassa." },
  { q: "Il cliente azienda insiste per applicare la ritenuta: che faccio?", a: "Mostragli la dicitura del comma 67 e, se serve, una copia della tua dichiarazione di inizio attività con l'opzione per il regime. Se la trattiene comunque, la scomputi nella dichiarazione dei redditi." },
  { q: "Serve il bollo sul preventivo?", a: "No, solo sulla fattura o ricevuta. Nel preventivo lo mostriamo perché il totale accettato coincida con quello della fattura." },
  { q: "Il preventivo in forfettario deve avere un numero?", a: "Non è obbligatorio, ma numerarlo ti aiuta a richiamarlo in fattura (“come da preventivo n. 12 del…”) e a tenerne traccia." },
  { q: "Il modello fa tutto da solo?", a: "Sì: scegli “Forfettario” nelle opzioni e il PDF toglie IVA e ritenuta, aggiunge il bollo quando dovuto e stampa le diciture in calce." },
];

export default function Page() {
  const base = appUrl();
  const jsonLd = [faqJsonLd(faq), breadcrumbJsonLd([{ name: "Guide", url: `${base}/strumenti` }, { name: "Preventivo in regime forfettario", url: `${base}${PATH}` }])];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ContentPage
        eyebrow={{ href: "/strumenti", label: "Guide e calcolatori" }}
        title="Preventivo in regime forfettario: come si fa, diciture e calcolo"
        intro={[
          "Il preventivo di un forfettario è più semplice di quello ordinario e proprio per questo pieno di piccoli errori: niente IVA e niente ritenuta d'acconto, ma due righe che spesso mancano, la rivalsa INPS del 4% se sei in Gestione Separata e l'imposta di bollo da 2 euro sopra i 77,47 euro, e due diciture di legge da riportare sul documento.",
          "Qui trovi il calcolo, le diciture pronte da copiare e un modello che le inserisce da solo.",
        ]}
        tool={<FiscalCalculator title="Calcola il totale del preventivo in forfettario" show={{ regime: false, vat: false, ritenuta: false }} initial={{ amount: 1000, vat: 0, regime: "forfettario", rivalsa: true, rivalsaKind: "inps", ritenuta: false, bollo: true }} />}
        sections={[
          {
            h: "Cosa cambia rispetto al regime ordinario",
            list: [
              "Niente IVA: i prezzi che scrivi sono quelli finali per il cliente (art. 1, commi 54-89, L. 190/2014). Con i privati è un vantaggio competitivo del 22%: dillo.",
              "Niente ritenuta d'acconto: il cliente azienda ti paga il totale (comma 67). Serve la dicitura, altrimenti l'amministrazione la trattiene per abitudine.",
              "Rivalsa INPS 4%: se sei in Gestione Separata puoi aggiungerla; se sei iscritto a una cassa, il contributo integrativo.",
              "Imposta di bollo da 2 €: dovuta sulla fattura sopra 77,47 €; mostrala già nel preventivo.",
              "Numero e data, validità, condizioni di pagamento, esclusioni: come per tutti.",
            ],
          },
          {
            h: "Le diciture da riportare",
            p: ["Vanno in calce al preventivo e poi sulla fattura. Copiale così come sono:"],
            quotes: [
              "Operazione senza applicazione dell'IVA ai sensi dell'art. 1, commi da 54 a 89, della Legge n. 190/2014 (regime forfettario).",
              "Compenso non soggetto a ritenuta d'acconto ai sensi dell'art. 1, comma 67, della Legge n. 190/2014.",
              "Imposta di bollo da 2,00 € assolta sull'originale per importi superiori a 77,47 € (art. 13 Tariffa DPR 642/1972).",
            ],
          },
          {
            h: "Esempio di calcolo",
            p: [
              "Compenso 1.000 €, rivalsa INPS 4% 40 €, bollo 2 €: totale 1.042 €, e 1.042 € è anche quello che incassi, perché non c'è ritenuta. Lo stesso lavoro in regime ordinario con un cliente azienda: totale 1.268,80 €, netto incassato 1.060,80 €.",
            ],
          },
          {
            h: "Gli errori più comuni",
            list: [
              "Scrivere “IVA esclusa” o “+ IVA”: il cliente si aspetta un 22% in più e, quando non arriva, pensa che il preventivo fosse sbagliato. Scrivi “importi non soggetti a IVA”.",
              "Lasciare che il cliente trattenga la ritenuta: la recuperi in dichiarazione, ma intanto hai incassato il 20% in meno.",
              "Dimenticare il bollo e scoprirlo in fattura: 2 € di discussione evitabile.",
              "Non indicare la validità: i prezzi non durano per sempre, 30 giorni è lo standard.",
            ],
          },
          {
            h: "I limiti da tenere d'occhio",
            p: [
              "Il regime forfettario vale fino a 85.000 € di ricavi o compensi nell'anno; sopra, esci dall'anno successivo, e sopra 100.000 € esci subito, con IVA dovuta dalla fattura che supera la soglia. La rivalsa INPS concorre al calcolo: 82.000 € di compensi con il 4% diventano 85.280 €.",
            ],
          },
        ]}
        faq={faq}
        cta={{ href: "/app?regime=forfettario&rivalsa=4", label: "Crea il preventivo in forfettario", text: "Il tuo preventivo in forfettario, con le diciture giuste, in 60 secondi" }}
        related={[
          { href: "/strumenti/imposta-di-bollo-2-euro", label: "Imposta di bollo da 2 euro" },
          { href: "/strumenti/calcolo-rivalsa-inps", label: "Calcolo rivalsa INPS 4%" },
          { href: "/preventivo-prestazione-occasionale", label: "Preventivo senza partita IVA" },
          { href: "/come-fare-un-preventivo", label: "Come fare un preventivo" },
          { href: "/preventivo", label: "Modelli per professione" },
        ]}
        supportEmail={businessEnv.supportEmail()}
        businessName={businessEnv.name()}
      />
    </>
  );
}
