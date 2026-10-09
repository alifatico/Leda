import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { FiscalCalculator, ScorporoRivalsa } from "@/components/tools/FiscalCalculator";
import { appUrl, businessEnv } from "@/lib/env";
import { breadcrumbJsonLd, faqJsonLd, type Faq } from "@/lib/seo";

const PATH = "/strumenti/calcolo-rivalsa-inps";
const TITLE = "Calcolo rivalsa INPS 4%: da compenso a totale e scorporo";
const DESCRIPTION =
  "Calcolatore della rivalsa INPS 4% per la Gestione Separata: compenso, rivalsa, IVA, ritenuta e netto, più lo scorporo da un importo lordo. Regole per forfettari e casse di previdenza.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${appUrl()}${PATH}` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article" },
};

const faq: Faq[] = [
  { q: "La rivalsa INPS è obbligatoria?", a: "No, è una facoltà del professionista. Se non la applichi, i contributi alla Gestione Separata restano interamente a tuo carico." },
  { q: "Il cliente può rifiutarsi di pagarla?", a: "Se è scritta nel preventivo che ha accettato, no: fa parte del corrispettivo. Se non l'hai indicata, è una trattativa persa in partenza. Per questo va messa prima, non in fattura a sorpresa." },
  { q: "La rivalsa va in Certificazione Unica?", a: "Sì, perché è compenso: il cliente certifica compenso più rivalsa e la ritenuta calcolata su entrambi." },
  { q: "Posso applicare il 4% se faccio prestazioni occasionali senza partita IVA?", a: "No. La rivalsa spetta ai professionisti con partita IVA iscritti alla Gestione Separata. Per il lavoro autonomo occasionale i contributi, dovuti sopra 5.000 € l'anno, sono per un terzo a carico tuo e per due terzi del committente, senza rivalsa." },
  { q: "Rivalsa 4% e ritenuta 20%: quale si calcola prima?", a: "La rivalsa si aggiunge al compenso; la ritenuta si calcola dopo, sul compenso più la rivalsa. Su 1.000 €: rivalsa 40 €, ritenuta 208 €." },
  { q: "La mia cassa applica il 2%, non il 4%: posso cambiarlo?", a: "Sì: nel generatore la percentuale e la dicitura del contributo sono modificabili, così il documento riporta l'aliquota della tua cassa." },
];

export default function Page() {
  const base = appUrl();
  const jsonLd = [faqJsonLd(faq), breadcrumbJsonLd([{ name: "Strumenti", url: `${base}/strumenti` }, { name: "Calcolo rivalsa INPS", url: `${base}${PATH}` }])];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ContentPage
        eyebrow={{ href: "/strumenti", label: "Calcolatori fiscali" }}
        title="Calcolo rivalsa INPS 4%: da compenso a totale, e viceversa"
        intro={[
          "La rivalsa INPS del 4% è la maggiorazione che il professionista iscritto alla Gestione Separata può addebitare al cliente per recuperare una parte dei contributi previdenziali (art. 1, comma 212, L. 662/1996). È facoltativa, va in preventivo e in fattura come riga separata e fa reddito a tutti gli effetti: ci si calcolano sopra IVA, ritenuta d'acconto e imposte.",
          "Chi è iscritto a una cassa professionale (Inarcassa, Cassa Forense, ENPAP, EPPI, ENPACL…) non applica la rivalsa INPS ma il contributo integrativo della propria cassa, di solito il 4%: è soggetto a IVA ma non a ritenuta d'acconto e non è reddito del professionista.",
        ]}
        tool={
          <div className="space-y-6">
            <FiscalCalculator title="Da compenso a totale e netto" initial={{ amount: 1000, vat: 22, regime: "ordinario", rivalsa: true, rivalsaKind: "inps", ritenuta: true, bollo: true }} />
            <ScorporoRivalsa />
          </div>
        }
        sections={[
          {
            h: "Da compenso a totale",
            p: [
              "Compenso 1.000 €, rivalsa 4% 40 €, imponibile 1.040 €. In regime ordinario aggiungi l'IVA 22% su 1.040 €: 228,80 €, totale 1.268,80 €. Se il cliente è un sostituto d'imposta trattiene il 20% su 1.040 €, cioè 208 €: incassi 1.060,80 €.",
              "In regime forfettario niente IVA e niente ritenuta: 1.000 + 40 + bollo 2 € = 1.042 €, tutti incassati.",
            ],
          },
          {
            h: "Scorporo: da importo lordo a compenso",
            p: [
              "Hai concordato “1.040 € compresa rivalsa”? Il compenso è 1.040 / 1,04 = 1.000 €, la rivalsa 40 €. Serve quando il cliente ragiona a budget totale, o quando hai dimenticato di dire che il prezzo era al netto del 4%.",
            ],
          },
          {
            h: "Rivalsa INPS o contributo di cassa: la differenza che cambia la ritenuta",
            list: [
              "Rivalsa INPS 4% (Gestione Separata): è compenso, entra nell'IVA e nella base della ritenuta d'acconto, va dichiarata come reddito.",
              "Contributo integrativo di cassa 4% (Inarcassa, Cassa Forense, ENPAP, EPPI…): entra nell'IVA ma non nella ritenuta e non è reddito tuo, lo versi alla cassa.",
              "Alcune casse applicano aliquote diverse, ad esempio il 2% di ENPAP ed ENPAV: verifica la tua e imposta la percentuale nel preventivo.",
            ],
          },
          {
            h: "Rivalsa nel regime forfettario",
            p: [
              "Puoi applicarla anche in forfettario, se sei iscritto alla Gestione Separata. Non c'è IVA, quindi il 4% si somma al compenso e basta; conta però ai fini del limite di ricavi di 85.000 € e del reddito su cui paghi l'imposta sostitutiva.",
            ],
          },
          {
            h: "Come scriverla nel preventivo",
            p: [
              "Dillo prima: “compenso 1.000 € oltre rivalsa INPS 4%”, oppure la riga separata con l'importo. Se il preventivo riporta solo “1.000 €” il cliente può legittimamente pretendere che sia tutto compreso. Il PDF di questo sito aggiunge la riga della rivalsa con la dicitura che preferisci, anche “Contributo integrativo Inarcassa 4%”, e la tiene fuori dalla ritenuta quando è un contributo di cassa.",
            ],
          },
        ]}
        faq={faq}
        cta={{ href: "/app?regime=ordinario&rivalsa=4&ritenuta=20&vat=22", label: "Crea il preventivo", text: "Rivalsa, IVA e ritenuta calcolate da sole: il preventivo in 60 secondi" }}
        related={[
          { href: "/strumenti/calcolo-ritenuta-acconto", label: "Calcolo ritenuta d'acconto" },
          { href: "/preventivo-forfettario", label: "Preventivo in regime forfettario" },
          { href: "/preventivo/consulente", label: "Modello preventivo per consulenti" },
          { href: "/preventivo/architetto", label: "Modello preventivo per architetti" },
          { href: "/come-fare-un-preventivo", label: "Come fare un preventivo" },
        ]}
        supportEmail={businessEnv.supportEmail()}
        businessName={businessEnv.name()}
      />
    </>
  );
}
