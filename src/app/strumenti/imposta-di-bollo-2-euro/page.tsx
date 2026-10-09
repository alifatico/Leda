import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { FiscalCalculator } from "@/components/tools/FiscalCalculator";
import { appUrl, businessEnv } from "@/lib/env";
import { breadcrumbJsonLd, faqJsonLd, type Faq } from "@/lib/seo";

const PATH = "/strumenti/imposta-di-bollo-2-euro";
const TITLE = "Imposta di bollo da 2 euro: quando serve su fatture e ricevute";
const DESCRIPTION =
  "Quando si applica la marca da bollo da 2 € su fatture senza IVA, forfettari e ricevute per prestazione occasionale, chi la paga e come indicarla nel preventivo. Calcolatore e diciture pronte.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${appUrl()}${PATH}` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article" },
};

const faq: Faq[] = [
  { q: "Il bollo si applica anche al preventivo?", a: "No: il preventivo non è un documento fiscale. Si applica alla fattura o alla ricevuta che emetterai dopo. Nel preventivo conviene mostrarlo per far accettare il totale definitivo." },
  { q: "Fattura con IVA da 5.000 €: serve il bollo?", a: "No. Il bollo riguarda solo gli importi non assoggettati a IVA: IVA e bollo sono alternativi." },
  { q: "Forfettario con fattura da 70 €: serve?", a: "No, è sotto la soglia di 77,47 €. Da 77,48 € in su sì." },
  { q: "Posso farlo pagare al cliente?", a: "Sì, come riga separata “imposta di bollo”. Per i forfettari l'importo riaddebitato diventa parte del compenso ai fini delle imposte (Agenzia delle Entrate, risposta n. 428/2022)." },
  { q: "Ricevuta per prestazione occasionale: bollo fisico o virtuale?", a: "Di regola la marca da bollo fisica sull'originale consegnato al cliente, perché non c'è fattura elettronica. L'assolvimento virtuale richiede un'autorizzazione che chi lavora occasionalmente di solito non ha." },
  { q: "Cosa rischio se dimentico il bollo?", a: "Una sanzione dal 100% al 500% dell'imposta per ogni documento (art. 25 DPR 642/1972), oltre all'imposta: pochi euro, ma il ravvedimento operoso costa ancora meno." },
];

export default function Page() {
  const base = appUrl();
  const jsonLd = [faqJsonLd(faq), breadcrumbJsonLd([{ name: "Strumenti", url: `${base}/strumenti` }, { name: "Imposta di bollo da 2 euro", url: `${base}${PATH}` }])];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ContentPage
        eyebrow={{ href: "/strumenti", label: "Calcolatori fiscali" }}
        title="Imposta di bollo da 2 euro: quando si applica e chi la paga"
        intro={[
          "L'imposta di bollo da 2 euro si applica a fatture, ricevute e note senza IVA di importo superiore a 77,47 euro (art. 13 della Tariffa, parte I, allegata al DPR 642/1972): forfettari, prestazioni occasionali, operazioni esenti o fuori campo. Sulle fatture con IVA non è dovuta: IVA e bollo sono alternativi.",
          "Il preventivo in sé non paga il bollo, perché è un'offerta e non un documento fiscale. Conviene però mostrarlo già nel preventivo quando sai che la fattura lo avrà: così il totale che il cliente accetta è quello che pagherà davvero.",
        ]}
        tool={<FiscalCalculator title="Il bollo è dovuto? Calcola il totale" show={{ rivalsa: false, ritenuta: false }} initial={{ amount: 100, vat: 0, regime: "forfettario", rivalsa: false, rivalsaKind: "inps", ritenuta: false, bollo: true }} />}
        sections={[
          {
            h: "Quando è dovuto e quando no",
            list: [
              "Fattura o ricevuta senza IVA sopra 77,47 €: sì, 2 €.",
              "Fattura con IVA, anche di importo alto: no.",
              "Fattura mista, in parte con IVA e in parte esente: sì, se la parte senza IVA supera 77,47 €.",
              "Importo senza IVA fino a 77,47 €: no.",
              "Preventivo: no, mai; lo mostriamo solo per trasparenza sul totale.",
            ],
          },
          {
            h: "Chi paga i 2 euro",
            p: [
              "L'obbligato è chi emette il documento. Puoi addebitarlo al cliente come voce separata “imposta di bollo”: è la prassi e il cliente la conosce. Attenzione se sei in regime forfettario: per l'Agenzia delle Entrate il bollo riaddebitato è parte del compenso e quindi del reddito (risposta a interpello n. 428/2022).",
            ],
          },
          {
            h: "Come si paga",
            list: [
              "Fattura elettronica: bollo virtuale, con la dicitura “imposta di bollo assolta in modo virtuale ai sensi del DM 17 giugno 2014”; l'Agenzia calcola il dovuto e si paga a trimestri dal portale Fatture e Corrispettivi o con F24 (codici tributo 2521, 2522, 2523 e 2524 per i quattro trimestri).",
              "Fattura cartacea o ricevuta per prestazione occasionale: marca da bollo da 2 € applicata sull'originale consegnato al cliente, con data non successiva a quella del documento.",
              "Forfettari con fattura elettronica: stesso meccanismo virtuale; il flag del bollo lo imposta il software di fatturazione.",
            ],
          },
          {
            h: "Le diciture",
            quotes: [
              "Imposta di bollo da 2,00 € assolta sull'originale ai sensi dell'art. 13 della Tariffa allegata al DPR 642/1972.",
              "Imposta di bollo assolta in modo virtuale ai sensi del DM 17/06/2014.",
            ],
          },
          {
            h: "Nel preventivo",
            p: [
              "Il modello di questo sito aggiunge automaticamente 2 € al totale quando gli importi senza IVA superano 77,47 €, con la dicitura in calce. Puoi disattivarlo se preferisci assorbire il costo.",
            ],
          },
        ]}
        faq={faq}
        cta={{ href: "/app?regime=forfettario", label: "Crea il preventivo", text: "Preventivo con bollo e diciture già a posto" }}
        related={[
          { href: "/preventivo-forfettario", label: "Preventivo in regime forfettario" },
          { href: "/preventivo-prestazione-occasionale", label: "Preventivo senza partita IVA" },
          { href: "/strumenti/calcolo-ritenuta-acconto", label: "Calcolo ritenuta d'acconto" },
          { href: "/strumenti/calcolo-rivalsa-inps", label: "Calcolo rivalsa INPS 4%" },
          { href: "/come-fare-un-preventivo", label: "Come fare un preventivo" },
        ]}
        supportEmail={businessEnv.supportEmail()}
        businessName={businessEnv.name()}
      />
    </>
  );
}
