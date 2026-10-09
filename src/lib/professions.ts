import { BRAND } from "@/lib/brand";
import type { LineItem, Quote, QuoteOptions } from "./quote";
import { newQuote } from "./quote";

/**
 * SEO landing pages "preventivo per <professione>": unique Italian content plus
 * a realistic prefilled template that opens in the builder (/app?template=slug).
 * Everything here must be deterministic (fixed ids, no clock) so pages prerender.
 */

export type TemplateItem = { description: string; details?: string; quantity: number; unit: string; unitPrice: number; vatRate?: number };

export type Profession = {
  slug: string;
  name: string;
  /** who the page is for, lower-case plural for sentences */
  who: string;
  title: string;
  metaDescription: string;
  intro: string[];
  subject: string;
  items: TemplateItem[];
  notes: string;
  paymentTerms: string;
  options?: Partial<QuoteOptions>;
  tips: string[];
  faq: { q: string; a: string }[];
};

const PAY_30 = "30% alla conferma, saldo alla consegna. Bonifico bancario entro 30 giorni dalla data fattura.";
const PAY_50 = "50% alla conferma dell'ordine, saldo a fine lavori. Bonifico bancario.";

export const professions: Profession[] = [
  {
    slug: "web-designer",
    name: "Web designer",
    who: "web designer e sviluppatori di siti",
    title: "Preventivo per web designer: modello, voci e prezzi",
    metaDescription:
      "Come fare un preventivo per un sito web: voci tipiche, prezzi di mercato, ritenuta e forfettario. Modello precompilato da scaricare in PDF, gratis e senza registrazione.",
    intro: [
      "Il preventivo per un sito web funziona quando è scomposto in fasi che il cliente capisce: analisi e struttura, design, sviluppo, contenuti, messa online e manutenzione. Una voce unica \"sito web 2.500 €\" invita a trattare sul prezzo; cinque voci chiare spostano la discussione su cosa includere.",
      "Scrivi sempre cosa è escluso: testi e foto forniti dal cliente, costi di dominio e hosting, revisioni oltre le due incluse. È la clausola che evita il 90% delle discussioni a fine lavori.",
    ],
    subject: "Sito web vetrina responsive (5 pagine)",
    items: [
      { description: "Analisi, struttura del sito e wireframe", details: "Call di briefing, mappa delle pagine, wireframe delle pagine principali", quantity: 1, unit: "a corpo", unitPrice: 350 },
      { description: "Design grafico delle pagine", details: "Home + 4 pagine interne, desktop e mobile, 2 round di revisioni", quantity: 5, unit: "pagine", unitPrice: 180 },
      { description: "Sviluppo e messa online", details: "CMS WordPress, tema su misura, form contatti, SEO di base, configurazione dominio e hosting del cliente", quantity: 1, unit: "a corpo", unitPrice: 1200 },
      { description: "Inserimento contenuti forniti dal cliente", quantity: 5, unit: "pagine", unitPrice: 40 },
      { description: "Manutenzione e aggiornamenti", details: "Aggiornamenti CMS e plugin, backup, piccole modifiche fino a 1 ora/mese", quantity: 12, unit: "mesi", unitPrice: 35 },
    ],
    notes: "Tempi: 4-5 settimane dall'approvazione del design e dalla consegna dei contenuti. Esclusi: testi, foto, licenze di font e plugin a pagamento, dominio e hosting.",
    paymentTerms: PAY_30,
    tips: [
      "Separa design, sviluppo e manutenzione: la manutenzione ricorrente è il margine più stabile che hai.",
      "Se il cliente è un'azienda o un professionista, applica la ritenuta d'acconto del 20%: il netto che incasserai è più basso del totale, meglio saperlo prima.",
      "In regime forfettario attiva l'interruttore dedicato: niente IVA, niente ritenuta e dicitura di legge in calce.",
    ],
    faq: [
      { q: "Quanto costa un sito web vetrina?", a: "Per un sito di 5 pagine su CMS i preventivi dei freelance italiani vanno da circa 1.500 a 4.000 € più IVA, in base a design su misura, contenuti e integrazioni. L'e-commerce parte da 3.500-4.000 €." },
      { q: "Devo mettere l'IVA nel preventivo?", a: "Sì, se sei in regime ordinario: 22% sulle prestazioni di web design. In forfettario non si applica e il documento deve riportare la dicitura prevista dalla L. 190/2014." },
      { q: "Chiedo un acconto?", a: "Sì: il 30% alla conferma copre le ore di analisi e design e filtra i clienti poco convinti. Indicalo chiaramente nelle condizioni di pagamento." },
    ],
  },
  {
    slug: "grafico",
    name: "Grafico",
    who: "graphic designer e illustratori",
    title: "Preventivo per grafico: logo, brand identity e stampa",
    metaDescription:
      "Modello di preventivo per grafici: logo, immagine coordinata, impaginazione e illustrazioni con prezzi realistici. Crea il PDF in un minuto, gratis e senza registrazione.",
    intro: [
      "Nel preventivo di un grafico il valore non è l'ora di lavoro ma l'uso che il cliente farà del risultato. Per questo conviene distinguere il compenso per il progetto dalla cessione dei diritti di utilizzo: un logo usato da una multinazionale non vale quanto lo stesso logo per un bar di quartiere.",
      "Indica sempre quante proposte e quanti round di revisione sono inclusi e cosa costa ogni revisione aggiuntiva. È il modo più semplice per chiudere i progetti senza infinite modifiche gratuite.",
    ],
    subject: "Logo e immagine coordinata",
    items: [
      { description: "Progettazione logo", details: "Ricerca, 3 proposte creative, 2 round di revisioni sulla proposta scelta", quantity: 1, unit: "a corpo", unitPrice: 900 },
      { description: "File finali e manuale d'uso del marchio", details: "Vettoriali (AI, SVG, PDF), PNG, versioni positiva/negativa, palette e font, mini brand book", quantity: 1, unit: "a corpo", unitPrice: 250 },
      { description: "Immagine coordinata", details: "Biglietto da visita, carta intestata, firma email, template post social", quantity: 1, unit: "a corpo", unitPrice: 450 },
      { description: "Cessione diritti di utilizzo", details: "Uso illimitato nel tempo su tutti i supporti, territorio Italia", quantity: 1, unit: "a corpo", unitPrice: 300 },
    ],
    notes: "Consegna: 3 settimane dalla conferma. Revisioni oltre quelle incluse: 60 €/ora. Esclusi costi di stampa e registrazione del marchio.",
    paymentTerms: "40% alla conferma, saldo alla consegna dei file finali. Bonifico a 30 giorni.",
    tips: [
      "Metti i diritti di utilizzo come voce separata: rende visibile il valore e ti protegge se il cliente estende l'uso.",
      "Non consegnare i sorgenti prima del saldo: scrivilo nelle note.",
      "Con clienti aziende la ritenuta d'acconto si applica: attiva l'opzione e il netto a pagare compare in calce.",
    ],
    faq: [
      { q: "Quanto costa un logo professionale?", a: "Un freelance esperto in Italia chiede tra 600 e 2.500 € per logo con proposte, revisioni e file finali; studi strutturati partono da 3.000 €. Sotto i 300 € di solito si trovano solo soluzioni da template." },
      { q: "Devo fatturare i diritti d'autore?", a: "La cessione dei diritti di utilizzo economico dell'opera può avere un trattamento fiscale diverso dal compenso professionale. Mettila come voce separata e verifica il regime con il tuo commercialista." },
      { q: "Quante revisioni includere?", a: "Due round sulla proposta scelta sono lo standard. Oltre, un costo orario dichiarato nel preventivo." },
    ],
  },
  {
    slug: "fotografo",
    name: "Fotografo",
    who: "fotografi professionisti",
    title: "Preventivo per fotografo: servizi, post-produzione e diritti d'uso",
    metaDescription:
      "Preventivo fotografico professionale: servizio, post-produzione, diritti di utilizzo delle immagini e spese. Modello precompilato per matrimoni, corporate ed e-commerce.",
    intro: [
      "Il preventivo di un fotografo deve rispondere a tre domande del cliente: quante ore di servizio, quante foto consegnate e come potrà usarle. Le prime due sono facili; la terza, i diritti di utilizzo, è quella che separa il professionista dall'amatore e ti permette di prezzare correttamente un lavoro per un'azienda.",
      "Metti le spese vive (trasferta, noleggio attrezzatura, location) in voci separate: il cliente le capisce e non le confonde con il tuo compenso.",
    ],
    subject: "Servizio fotografico corporate e ritratti del team",
    items: [
      { description: "Servizio fotografico in sede", details: "Mezza giornata (4 ore), ritratti del team e ambienti, assistente incluso", quantity: 4, unit: "ore", unitPrice: 120 },
      { description: "Selezione e post-produzione", details: "40 immagini finali ad alta risoluzione, color correction e ritocco base", quantity: 40, unit: "foto", unitPrice: 12 },
      { description: "Diritti di utilizzo", details: "Uso web e social illimitato, stampa aziendale, 3 anni, territorio mondo", quantity: 1, unit: "a corpo", unitPrice: 350 },
      { description: "Spese di trasferta", details: "Rimborso chilometrico e parcheggio", quantity: 1, unit: "a corpo", unitPrice: 45 },
    ],
    notes: "Consegna delle immagini entro 10 giorni lavorativi tramite galleria online. Foto aggiuntive oltre le 40 incluse: 15 € cad. Le immagini non selezionate non vengono consegnate.",
    paymentTerms: "Acconto del 30% alla prenotazione della data, saldo alla consegna delle immagini.",
    tips: [
      "Specifica durata, territorio e canali dei diritti di utilizzo: un uso pubblicitario nazionale vale più di un uso web.",
      "L'acconto alla prenotazione blocca la data: senza acconto, la data resta libera. Scrivilo.",
      "Per i matrimoni descrivi copertura oraria, numero di fotografi e tempi di consegna dell'album.",
    ],
    faq: [
      { q: "Quanto costa un servizio fotografico aziendale?", a: "Una mezza giornata con post-produzione e diritti web costa in media 600-1.200 € più IVA; una giornata intera 1.000-2.000 €. I matrimoni partono da 1.500 € e superano i 4.000 € per coperture complete." },
      { q: "I diritti d'uso sono soggetti a IVA?", a: "Sì, nel regime ordinario la cessione dei diritti di utilizzo delle fotografie è soggetta a IVA al 22%. In forfettario non si applica IVA. Per la parte di diritto d'autore chiedi al commercialista il trattamento corretto." },
      { q: "Devo consegnare i RAW?", a: "Di norma no: consegni le immagini finite. Se il cliente li vuole, prezzali come voce separata." },
    ],
  },
  {
    slug: "videomaker",
    name: "Videomaker",
    who: "videomaker e filmmaker",
    title: "Preventivo per videomaker: riprese, montaggio e diritti",
    metaDescription:
      "Modello di preventivo per video aziendali, social e spot: pre-produzione, riprese, montaggio, musica e diritti d'uso con prezzi di riferimento. PDF in un minuto.",
    intro: [
      "Un video ha tre fasi con costi diversi: pre-produzione (concept, sceneggiatura, sopralluoghi), produzione (giornate di ripresa, crew, attrezzatura) e post-produzione (montaggio, color, audio, grafica). Un preventivo diviso per fasi permette al cliente di capire dove risparmiare senza compromettere il risultato.",
      "Dichiara il numero di versioni incluse (durata, formati verticali per social) e i round di revisione del montaggio: è lì che i progetti video sforano.",
    ],
    subject: "Video aziendale di presentazione (2 minuti) + 3 cut social",
    items: [
      { description: "Pre-produzione", details: "Concept, scaletta, sopralluogo e piano di ripresa", quantity: 1, unit: "a corpo", unitPrice: 400 },
      { description: "Giornata di riprese", details: "Operatore + assistente, 2 camere, luci e audio, fino a 8 ore", quantity: 1, unit: "giorno", unitPrice: 900 },
      { description: "Montaggio e post-produzione", details: "Video master 2 minuti, color grading, mix audio, grafiche e sottotitoli, 2 round di revisioni", quantity: 1, unit: "a corpo", unitPrice: 850 },
      { description: "Cut per social", details: "3 versioni verticali 15-30 secondi per Instagram, TikTok e LinkedIn", quantity: 3, unit: "pz", unitPrice: 120 },
      { description: "Licenza musicale", details: "Brano royalty-free con licenza commerciale", quantity: 1, unit: "pz", unitPrice: 60 },
    ],
    notes: "Consegna del master entro 15 giorni lavorativi dalle riprese. Revisioni oltre le incluse: 70 €/ora. Esclusi: attori, location a pagamento, speaker professionista.",
    paymentTerms: PAY_50,
    tips: [
      "Prezzale a giornata le riprese e a corpo la post-produzione: il cliente capisce meglio e tu proteggi le ore di montaggio.",
      "Specifica i diritti d'uso del video: canali, durata e territorio.",
      "Le trasferte e i noleggi vanno in voci separate, rimborsate a piè di lista o a forfait.",
    ],
    faq: [
      { q: "Quanto costa un video aziendale?", a: "Un video di presentazione di 1-2 minuti con una giornata di riprese e montaggio professionale costa in media 1.800-4.000 € più IVA. Spot con attori e più giornate superano i 6.000 €." },
      { q: "Quante revisioni includere nel montaggio?", a: "Due round sul montaggio e uno sul color sono lo standard. Ogni ulteriore revisione va prezzata a ore." },
      { q: "Serve l'acconto?", a: "Sì, il 50% alla conferma copre pre-produzione e riprese, che sostieni prima di consegnare qualunque cosa." },
    ],
  },
  {
    slug: "copywriter",
    name: "Copywriter",
    who: "copywriter e content writer",
    title: "Preventivo per copywriter: testi web, articoli e campagne",
    metaDescription:
      "Come fare un preventivo per testi web, articoli SEO e campagne: voci, tariffe a cartella o a progetto, ritenuta d'acconto e forfettario. Modello precompilato in PDF.",
    intro: [
      "Il copywriter vende chiarezza e risultati, non parole al chilo. Per questo i preventivi migliori ragionano a progetto o a pagina, con la tariffa a cartella usata solo per volumi ripetitivi come gli articoli di un blog.",
      "Metti in chiaro cosa riceve il cliente: numero di proposte per i titoli, round di revisione, ricerca delle keyword inclusa o esclusa, e chi inserisce i testi nel sito.",
    ],
    subject: "Testi per sito web e piano editoriale blog",
    items: [
      { description: "Testi per il sito web", details: "Home, Chi siamo, Servizi (3 pagine), Contatti: tono di voce, SEO on-page, 2 round di revisioni", quantity: 6, unit: "pagine", unitPrice: 150 },
      { description: "Articoli per il blog", details: "Articoli SEO da 800-1.000 parole, ricerca keyword inclusa, 1 round di revisioni", quantity: 4, unit: "articoli", unitPrice: 120 },
      { description: "Piano editoriale trimestrale", details: "12 argomenti con keyword, intento di ricerca e calendario", quantity: 1, unit: "a corpo", unitPrice: 250 },
    ],
    notes: "Consegna testi sito: 10 giorni lavorativi dal briefing. Gli articoli vengono consegnati uno a settimana. Revisioni oltre le incluse: 50 €/ora.",
    paymentTerms: PAY_30,
    tips: [
      "Indica la lunghezza indicativa di ogni testo: evita il \"mi aspettavo di più\".",
      "Se il cliente è un'azienda, la ritenuta d'acconto del 20% si applica sul compenso: il preventivo mostra totale e netto a pagare.",
      "Per i lavori continuativi proponi un canone mensile con un numero di contenuti incluso.",
    ],
    faq: [
      { q: "Quanto costa un articolo SEO?", a: "Tra 80 e 250 € a seconda di lunghezza, ricerca keyword e complessità del settore. I testi delle pagine principali di un sito valgono 120-300 € a pagina." },
      { q: "Tariffa a cartella o a progetto?", a: "A progetto per siti e campagne, dove conta il risultato. A cartella (1.800 battute) solo per volumi ripetitivi e omogenei." },
      { q: "Forfettario: cosa cambia nel preventivo?", a: `Niente IVA e niente ritenuta; il documento riporta la dicitura di legge. ${BRAND} lo fa con un interruttore.` },
    ],
  },
  {
    slug: "social-media-manager",
    name: "Social media manager",
    who: "social media manager e community manager",
    title: "Preventivo per social media manager: gestione mensile e campagne",
    metaDescription:
      "Modello di preventivo per la gestione dei social: canone mensile, contenuti inclusi, advertising e report. Prezzi di riferimento 2026 e PDF pronto in un minuto.",
    intro: [
      "La gestione social si vende a canone mensile. Il preventivo deve dire esattamente cosa include il canone: quanti post e stories, su quali canali, quante grafiche, se la community management è inclusa e con quali tempi di risposta, e con che frequenza arriva il report.",
      "Il budget pubblicitario va sempre separato dal tuo compenso per la gestione delle campagne: così il cliente non pensa che i 500 € di sponsorizzate siano il tuo guadagno.",
    ],
    subject: "Gestione social media mensile (Instagram + Facebook + LinkedIn)",
    items: [
      { description: "Strategia e piano editoriale iniziale", details: "Analisi del profilo e dei competitor, linee guida di tono e formati, calendario del primo mese", quantity: 1, unit: "a corpo", unitPrice: 400 },
      { description: "Gestione mensile dei canali", details: "12 post + 8 stories al mese, grafiche e copy, programmazione, community management entro 24 ore, report mensile", quantity: 3, unit: "mesi", unitPrice: 650 },
      { description: "Gestione campagne sponsorizzate", details: "Setup e ottimizzazione campagne Meta, budget pubblicitario escluso e pagato dal cliente", quantity: 3, unit: "mesi", unitPrice: 200 },
    ],
    notes: "Contratto di 3 mesi rinnovabile. Il budget pubblicitario è a carico del cliente e pagato direttamente a Meta. Shooting foto/video non incluso.",
    paymentTerms: "Canone mensile anticipato, bonifico entro il giorno 5 di ogni mese. Setup iniziale alla conferma.",
    tips: [
      "Scrivi il numero esatto di contenuti inclusi e il costo dei contenuti extra.",
      "Indica i tempi di risposta della community management: è la voce che pesa di più sul tuo tempo.",
      "Chiedi il canone anticipato: lavori il mese in corso già pagato.",
    ],
    faq: [
      { q: "Quanto costa la gestione dei social?", a: "Per una piccola impresa con 2-3 canali i freelance italiani chiedono 400-900 € al mese; agenzie strutturate dai 1.000 € in su. Le campagne pubblicitarie si prezzano a parte, spesso come percentuale del budget o a canone." },
      { q: "Il budget pubblicitario va nel preventivo?", a: "Indicalo nelle note come escluso e a carico del cliente. Se lo anticipi tu, mettilo come voce separata senza margine, oppure fallo pagare direttamente alla piattaforma." },
      { q: "Meglio contratto mensile o trimestrale?", a: "Trimestrale con rinnovo automatico: i risultati sui social arrivano dopo 2-3 mesi e un impegno breve genera abbandoni prematuri." },
    ],
  },
  {
    slug: "consulente",
    name: "Consulente",
    who: "consulenti di marketing, strategia e organizzazione",
    title: "Preventivo per consulente: giornate, progetti e rivalsa INPS",
    metaDescription:
      "Preventivo per attività di consulenza: tariffa a giornata o a progetto, rivalsa INPS 4%, ritenuta d'acconto 20% e acconto. Modello precompilato da scaricare in PDF.",
    intro: [
      `Il consulente iscritto alla Gestione Separata INPS ha due righe in più rispetto agli altri: la rivalsa INPS del 4%, che si aggiunge al compenso ed è soggetta a IVA, e la ritenuta d'acconto del 20% che il cliente trattiene e versa per conto suo. ${BRAND} le calcola entrambe e mostra il netto a pagare.`,
      "Per i progetti con obiettivi definiti preferisci il compenso a corpo; per il supporto continuativo la tariffa a giornata con un numero minimo di giornate al mese.",
    ],
    subject: "Consulenza strategica di marketing (3 mesi)",
    items: [
      { description: "Analisi iniziale e piano di marketing", details: "Audit di posizionamento, canali e funnel; documento strategico con priorità e KPI", quantity: 1, unit: "a corpo", unitPrice: 1800 },
      { description: "Giornate di consulenza operativa", details: "Affiancamento al team, riunioni di avanzamento, revisione materiali", quantity: 6, unit: "giornate", unitPrice: 550 },
      { description: "Report e revisione trimestrale", details: "Analisi dei risultati e aggiornamento del piano", quantity: 1, unit: "a corpo", unitPrice: 400 },
    ],
    notes: "Le giornate non utilizzate entro 3 mesi decadono. Spese di trasferta fuori provincia rimborsate a piè di lista.",
    paymentTerms: "Acconto del 30% alla conferma; fatturazione mensile delle giornate svolte, bonifico a 30 giorni.",
    options: { rivalsaInpsPct: 4, ritenutaAccontoPct: 20, depositPct: 30 },
    tips: [
      "Rivalsa INPS: se sei in Gestione Separata è un tuo diritto, non un costo del cliente da negoziare.",
      "La ritenuta d'acconto si applica solo se il cliente è un sostituto d'imposta (azienda, professionista): con i privati no.",
      "Indica la scadenza delle giornate acquistate: evita crediti infiniti.",
    ],
    faq: [
      { q: "Quanto costa una giornata di consulenza?", a: "In Italia un consulente senior chiede 400-900 € a giornata più IVA, a seconda del settore e dell'esperienza. Le tariffe junior partono da 250 €." },
      { q: "Come si calcola la ritenuta d'acconto?", a: "Il 20% sul compenso più la rivalsa INPS, mai sull'IVA. Esempio: 1.000 € + 40 € di rivalsa = 1.040 € imponibile; IVA 228,80 €; ritenuta 208 €; netto a pagare 1.060,80 €." },
      { q: "Il preventivo vale come contratto?", a: `Se il cliente lo accetta per iscritto, sì. Con ${BRAND} puoi inviarlo con un link e ricevere l'accettazione online.` },
    ],
  },
  {
    slug: "sviluppatore",
    name: "Sviluppatore software",
    who: "sviluppatori software e app",
    title: "Preventivo per sviluppatore: app, software e manutenzione",
    metaDescription:
      "Modello di preventivo per sviluppo software e app: analisi, sviluppo a sprint, test, deploy e manutenzione. Prezzi a giornata e a corpo, PDF pronto in un minuto.",
    intro: [
      "Lo sviluppo software è difficile da prezzare a corpo quando i requisiti cambiano. La soluzione che i clienti accettano meglio: una fase di analisi a corpo, poi sviluppo a sprint con un numero di giornate stimato, un range dichiarato e la regola che cambi di scope vengono preventivati a parte.",
      "Inserisci sempre la manutenzione come voce ricorrente: hosting, aggiornamenti di sicurezza, piccole evoluzioni. È il tuo reddito prevedibile.",
    ],
    subject: "Sviluppo web app gestionale (MVP)",
    items: [
      { description: "Analisi dei requisiti e prototipo", details: "Interviste, user stories, prototipo navigabile, architettura e stima di dettaglio", quantity: 1, unit: "a corpo", unitPrice: 1500 },
      { description: "Sviluppo MVP", details: "4 sprint da 2 settimane: autenticazione, anagrafiche, flusso ordini, dashboard; demo a fine sprint", quantity: 32, unit: "giornate", unitPrice: 420 },
      { description: "Test, deploy e formazione", details: "Test automatici, messa in produzione su cloud del cliente, 2 ore di formazione", quantity: 1, unit: "a corpo", unitPrice: 900 },
      { description: "Manutenzione evolutiva e correttiva", details: "Fino a 8 ore/mese, aggiornamenti di sicurezza, monitoraggio", quantity: 12, unit: "mesi", unitPrice: 320 },
    ],
    notes: "La stima delle giornate ha una tolleranza del ±15%. Funzionalità non previste nell'analisi vengono preventivate separatamente. Costi cloud esclusi.",
    paymentTerms: "Analisi alla conferma; sprint fatturati a fine sprint, bonifico a 30 giorni. Manutenzione mensile anticipata.",
    tips: [
      "Dichiara la tolleranza sulla stima: il cliente la accetta più volentieri di uno sforamento a sorpresa.",
      "Separa i costi cloud e le licenze: non sono il tuo compenso.",
      "Sprint fatturati alla consegna: flusso di cassa regolare e cliente che vede avanzamenti.",
    ],
    faq: [
      { q: "Quanto costa sviluppare un'app o una web app?", a: "Un MVP realistico con un freelance senior costa 12.000-25.000 € più IVA; app native per iOS e Android partono da 20.000 €. Le tariffe giornaliere in Italia vanno da 300 a 600 €." },
      { q: "A corpo o a giornata?", a: "Analisi a corpo, sviluppo a sprint con giornate stimate e range dichiarato. Il forfait totale va bene solo con requisiti chiusi e firmati." },
      { q: "La proprietà del codice?", a: "Scrivi nelle note chi detiene il codice e le licenze: di norma il cliente al saldo, con l'eccezione di librerie e componenti riutilizzabili dello sviluppatore." },
    ],
  },
  {
    slug: "traduttore",
    name: "Traduttore",
    who: "traduttori e interpreti",
    title: "Preventivo per traduttore: tariffe a parola, cartella e revisione",
    metaDescription:
      "Come fare un preventivo per traduzioni: tariffa a parola o a cartella, revisione, urgenza, asseverazione. Modello con prezzi di riferimento e PDF immediato.",
    intro: [
      "Le traduzioni si prezzano a parola sorgente o a cartella (1.500 caratteri spazi inclusi): dichiara l'unità e il conteggio nel preventivo, così il cliente sa come è stato calcolato il totale. Le combinazioni linguistiche rare e i testi tecnici giustificano tariffe più alte.",
      "Urgenza, formattazione complessa, revisione di un secondo traduttore e asseverazione in tribunale sono servizi aggiuntivi: elencali come voci separate.",
    ],
    subject: "Traduzione sito web e brochure IT > EN",
    items: [
      { description: "Traduzione sito web italiano > inglese", details: "Testi marketing, circa 8.000 parole sorgente, memoria di traduzione e glossario", quantity: 8000, unit: "parole", unitPrice: 0.11 },
      { description: "Traduzione brochure tecnica", details: "12 cartelle da 1.500 caratteri, terminologia di settore", quantity: 12, unit: "cartelle", unitPrice: 28 },
      { description: "Revisione di un secondo linguista", details: "Rilettura e controllo qualità su tutto il materiale", quantity: 1, unit: "a corpo", unitPrice: 320 },
      { description: "Supplemento urgenza", details: "Consegna entro 5 giorni lavorativi invece di 10", quantity: 1, unit: "a corpo", unitPrice: 200 },
    ],
    notes: "Conteggio parole sul testo sorgente. Testi non editabili (PDF, immagini) comportano un supplemento di formattazione. Eventuali modifiche al testo originale dopo la conferma vengono conteggiate a parte.",
    paymentTerms: "Bonifico a 30 giorni dalla data fattura. Per nuovi clienti acconto del 50% alla conferma.",
    tips: [
      "Specifica l'unità di conteggio e il numero esatto di parole o cartelle.",
      "Prezza la revisione come voce separata: molti clienti la vogliono per i testi pubblici.",
      "Traduttore in forfettario? Attiva l'opzione: niente IVA, niente ritenuta.",
    ],
    faq: [
      { q: "Quanto costa una traduzione a parola?", a: "Per le combinazioni comuni (IT-EN, IT-FR, IT-DE) 0,08-0,15 € a parola sorgente; testi tecnici e legali 0,12-0,20 €. Una cartella da 1.500 caratteri costa 20-35 €." },
      { q: "Cosa include l'asseverazione?", a: "Giuramento in tribunale, marche da bollo e diritti: indicale come voce separata con le spese vive rimborsate a parte." },
      { q: "Supplemento urgenza quanto?", a: "Dal 20 al 50% sul totale, in base ai tempi richiesti. Dichiaralo nel preventivo prima di accettare la scadenza." },
    ],
  },
  {
    slug: "architetto",
    name: "Architetto",
    who: "architetti e studi di progettazione",
    title: "Preventivo per architetto: parcella, fasi e contributo Inarcassa",
    metaDescription:
      "Preventivo per architetti: progetto preliminare, definitivo ed esecutivo, direzione lavori e pratiche. Contributo Inarcassa 4% e ritenuta calcolati, PDF in un minuto.",
    intro: [
      "Dal 2023 il preventivo scritto per le prestazioni professionali è obbligatorio e deve indicare il compenso e le spese. Per un architetto il modo più chiaro è dividere l'incarico in fasi: rilievo, progetto preliminare, definitivo, esecutivo, pratiche edilizie e direzione lavori.",
      "Al compenso si aggiunge il contributo integrativo Inarcassa del 4%, soggetto a IVA; se il committente è un'azienda si applica la ritenuta d'acconto del 20%. Il modello qui sotto usa la dicitura Inarcassa al posto di \"rivalsa INPS\".",
    ],
    subject: "Progettazione ristrutturazione appartamento (90 mq)",
    items: [
      { description: "Rilievo e stato di fatto", details: "Rilievo metrico e fotografico, restituzione grafica", quantity: 1, unit: "a corpo", unitPrice: 600 },
      { description: "Progetto preliminare", details: "2 proposte distributive, moodboard, stima sommaria dei costi", quantity: 1, unit: "a corpo", unitPrice: 1400 },
      { description: "Progetto definitivo ed esecutivo", details: "Tavole esecutive, impianti di massima, capitolato e computo metrico", quantity: 1, unit: "a corpo", unitPrice: 2600 },
      { description: "Pratica edilizia (CILA)", details: "Redazione e presentazione allo sportello unico, diritti di segreteria esclusi", quantity: 1, unit: "a corpo", unitPrice: 700 },
      { description: "Direzione lavori", details: "Sopralluoghi settimanali, contabilità di cantiere, assistenza alla scelta materiali", quantity: 1, unit: "a corpo", unitPrice: 2200 },
    ],
    notes: "Esclusi: diritti di segreteria, oneri comunali, pratiche strutturali e catastali, certificazioni impianti. Il compenso è calcolato con riferimento al D.M. 17/06/2016 ridotto in accordo con il committente.",
    paymentTerms: "30% alla sottoscrizione dell'incarico, 40% alla consegna del progetto esecutivo, saldo a fine lavori.",
    options: { rivalsaInpsPct: 4, rivalsaLabel: "Contributo integrativo Inarcassa 4%", depositPct: 30 },
    tips: [
      "Usa la dicitura \"Contributo integrativo Inarcassa 4%\": l'opzione rivalsa del builder è rinominabile.",
      "Elenca le esclusioni (oneri, diritti, pratiche strutturali): sono i costi che il cliente scopre dopo.",
      "Il preventivo scritto è obbligatorio per legge (L. 124/2017): conservane una copia accettata.",
    ],
    faq: [
      { q: "Quanto costa un progetto di ristrutturazione?", a: "Per un appartamento di 80-100 mq la parcella completa, dalla progettazione alla direzione lavori, vale in genere il 7-12% del costo dei lavori, cioè 5.000-12.000 € più contributo e IVA." },
      { q: "Inarcassa è come la rivalsa INPS?", a: "Funziona allo stesso modo nel calcolo: 4% sul compenso, soggetto a IVA. Cambia solo la dicitura, che nel builder puoi personalizzare." },
      { q: "Si applica la ritenuta d'acconto?", a: "Sì, se il committente è un'azienda o un professionista: 20% sul compenso più contributo. Con i privati no." },
    ],
  },
  {
    slug: "interior-designer",
    name: "Interior designer",
    who: "interior designer e home stager",
    title: "Preventivo per interior designer: progetto, moodboard e forniture",
    metaDescription:
      "Modello di preventivo per interior design: consulenza, progetto d'arredo, moodboard, render e assistenza agli acquisti. Prezzi al mq e a corpo, PDF in un minuto.",
    intro: [
      "Il cliente di un interior designer compra due cose: le idee (progetto, moodboard, render) e il tempo di seguire acquisti e fornitori. Tienile separate nel preventivo e indica se percepisci provvigioni dai fornitori: la trasparenza qui è ciò che genera il passaparola.",
      "Prezzare al metro quadro è comodo per le prime fasi; l'assistenza agli acquisti e il cantiere si prezzano a ore o a giornate.",
    ],
    subject: "Progetto d'interni zona giorno e camera (60 mq)",
    items: [
      { description: "Consulenza iniziale e rilievo", details: "Sopralluogo, analisi esigenze, rilievo misure e foto", quantity: 1, unit: "a corpo", unitPrice: 250 },
      { description: "Progetto d'arredo", details: "Planimetrie con layout, moodboard materiali e colori, 1 round di revisioni", quantity: 60, unit: "mq", unitPrice: 35 },
      { description: "Render fotorealistici", details: "Viste 3D degli ambienti principali", quantity: 3, unit: "render", unitPrice: 180 },
      { description: "Assistenza agli acquisti e ai fornitori", details: "Selezione prodotti, preventivi fornitori, verifica consegne", quantity: 12, unit: "ore", unitPrice: 60 },
    ],
    notes: "Esclusi: arredi, materiali, lavori edili e impiantistici, pratiche comunali. Eventuali sconti ottenuti dai fornitori sono interamente girati al cliente.",
    paymentTerms: "40% alla conferma, saldo alla consegna del progetto. Assistenza acquisti fatturata a consuntivo mensile.",
    tips: [
      "Dichiara se e quali provvigioni ricevi dai fornitori: in alternativa, girale al cliente e prezza il tuo tempo.",
      "Indica il numero di render e di revisioni inclusi.",
      "Con clienti privati niente ritenuta d'acconto: solo IVA, o nulla se sei in forfettario.",
    ],
    faq: [
      { q: "Quanto costa un progetto d'interni?", a: "I freelance italiani chiedono 25-60 € al mq per il progetto d'arredo con moodboard e render; per un appartamento di 80 mq si spendono 2.500-5.000 € più IVA. L'home staging per la vendita costa 500-1.500 €." },
      { q: "Render inclusi o a parte?", a: "A parte e in numero definito: ogni render fotorealistico richiede ore di lavoro e il cliente ne chiede sempre uno in più." },
      { q: "Serve l'acconto?", a: "Sì, il 40% alla conferma copre rilievo, progetto e moodboard, che consegni prima di qualunque incasso." },
    ],
  },
  {
    slug: "formatore",
    name: "Formatore",
    who: "formatori, docenti e coach",
    title: "Preventivo per formatore: corsi aziendali, giornate e materiali",
    metaDescription:
      "Modello di preventivo per corsi di formazione aziendale e coaching: progettazione, giornate d'aula, materiali, follow-up. Rivalsa INPS e ritenuta calcolate.",
    intro: [
      "Un corso di formazione si preventiva in tre parti: progettazione (analisi dei bisogni e personalizzazione), erogazione (giornate o mezze giornate in aula o online) e materiali o follow-up. Dichiara il numero massimo di partecipanti: è ciò che determina il valore di una giornata.",
      "Per le aziende che finanziano con i fondi interprofessionali servono voci e descrizioni dettagliate: il preventivo chiaro diventa la base della rendicontazione.",
    ],
    subject: "Corso di formazione \"Comunicazione efficace\" per il team vendite",
    items: [
      { description: "Analisi dei bisogni e progettazione", details: "Intervista ai responsabili, personalizzazione dei contenuti e dei casi aziendali", quantity: 1, unit: "a corpo", unitPrice: 600 },
      { description: "Giornate d'aula", details: "2 giornate da 7 ore, massimo 12 partecipanti, esercitazioni e role play", quantity: 2, unit: "giornate", unitPrice: 1100 },
      { description: "Materiali didattici", details: "Dispensa digitale, schede di lavoro, attestato di partecipazione", quantity: 12, unit: "partecipanti", unitPrice: 15 },
      { description: "Follow-up online", details: "Sessione di 2 ore a 30 giorni dal corso per verificare l'applicazione", quantity: 1, unit: "a corpo", unitPrice: 350 },
    ],
    notes: "Aula, proiettore e coffee break a carico dell'azienda. Spese di trasferta fuori regione rimborsate a piè di lista. Date da concordare con almeno 3 settimane di anticipo.",
    paymentTerms: "30% alla conferma delle date, saldo entro 30 giorni dall'ultima giornata di formazione.",
    options: { rivalsaInpsPct: 4, ritenutaAccontoPct: 20, depositPct: 30 },
    tips: [
      "Indica il numero massimo di partecipanti e il costo per i partecipanti extra.",
      "Le date confermate con acconto sono bloccate: dichiara la policy di cancellazione.",
      "Rivalsa INPS e ritenuta si applicano come per ogni professionista in Gestione Separata.",
    ],
    faq: [
      { q: "Quanto costa una giornata di formazione aziendale?", a: "Un formatore freelance chiede 600-1.500 € a giornata più IVA a seconda del tema e dell'esperienza; le società di formazione dai 1.500 € in su. Il coaching individuale costa 80-200 € a sessione." },
      { q: "La formazione è esente IVA?", a: "In generale no, salvo i casi previsti dall'art. 10 DPR 633/72 per enti riconosciuti. Verifica con il commercialista e, se esente, usa l'aliquota 0 con la dicitura corretta." },
      { q: "Come preventivare un percorso di coaching?", a: "A pacchetto: ad esempio 6 sessioni da 60 minuti con un prezzo complessivo e una scadenza entro cui usarle." },
    ],
  },
  {
    slug: "idraulico",
    name: "Idraulico",
    who: "idraulici e installatori termoidraulici",
    title: "Preventivo per idraulico: bagno, caldaia e IVA al 10%",
    metaDescription:
      "Modello di preventivo per idraulici: rifacimento bagno, sostituzione caldaia, interventi a ore. IVA 10% o 22%, manodopera e materiali separati. PDF in un minuto.",
    intro: [
      "Il preventivo dell'idraulico convince quando separa manodopera e materiali e indica l'aliquota IVA corretta: 10% per la manutenzione straordinaria e le ristrutturazioni su immobili residenziali, 22% per le nuove costruzioni e per le forniture di beni significativi oltre la soglia. Sbagliare l'aliquota costa più dello sconto.",
      "Scrivi cosa resta a carico del cliente (rivestimenti, sanitari scelti altrove, smaltimento) e la validità del preventivo: i prezzi dei materiali cambiano.",
    ],
    subject: "Rifacimento impianto idraulico bagno",
    items: [
      { description: "Smantellamento impianto esistente", details: "Rimozione sanitari, tubazioni e rubinetterie, smaltimento incluso", quantity: 1, unit: "a corpo", unitPrice: 350, vatRate: 10 },
      { description: "Nuovo impianto idrico e di scarico", details: "Tubazioni multistrato, collettori, scarichi in PP, prove di tenuta", quantity: 1, unit: "a corpo", unitPrice: 1450, vatRate: 10 },
      { description: "Installazione sanitari e rubinetterie", details: "Montaggio di 4 pezzi forniti dal cliente, box doccia e scaldasalviette", quantity: 6, unit: "pz", unitPrice: 85, vatRate: 10 },
      { description: "Materiali di consumo e raccorderia", quantity: 1, unit: "a corpo", unitPrice: 280, vatRate: 10 },
    ],
    notes: "Opere murarie e rivestimenti esclusi. Sanitari e rubinetterie forniti dal cliente. IVA al 10% per manutenzione straordinaria su immobile residenziale. Per la detrazione fiscale il pagamento va effettuato con bonifico parlante.",
    paymentTerms: PAY_50,
    tips: [
      "Separa manodopera e materiali: aiuta il cliente con le detrazioni fiscali.",
      "Indica validità breve (15-30 giorni) per proteggerti dall'aumento dei materiali.",
      "Ricorda il bonifico parlante nelle note: è un servizio che il cliente apprezza.",
    ],
    faq: [
      { q: "Quanto costa rifare l'impianto idraulico di un bagno?", a: "Per un bagno standard l'impianto idrico e di scarico completo costa 1.800-3.500 € più IVA al 10%, esclusi sanitari e opere murarie. La sostituzione di una caldaia a condensazione 1.800-3.000 € tutto compreso." },
      { q: "IVA al 10% o al 22%?", a: "10% per manutenzione ordinaria e straordinaria su abitazioni private, con il limite dei beni significativi; 22% per nuove costruzioni e per i lavori su immobili non residenziali. In caso di dubbio chiedi al commercialista." },
      { q: "Serve l'acconto?", a: "Sì: con il 50% alla conferma copri i materiali che compri prima di iniziare." },
    ],
  },
  {
    slug: "elettricista",
    name: "Elettricista",
    who: "elettricisti e installatori",
    title: "Preventivo per elettricista: impianto, punti luce e certificazione",
    metaDescription:
      "Modello di preventivo per elettricisti: rifacimento impianto a punti luce, quadro, certificazione DM 37/08. IVA 10% in ristrutturazione, PDF pronto in un minuto.",
    intro: [
      "Gli impianti elettrici si preventivano a punti (luce, presa, TV, dati) più quadro, linee e certificazione. Il metodo a punti è trasparente: il cliente conta i punti sulla planimetria e capisce il prezzo, tu eviti le sorprese dei \"ne aggiungiamo uno\".",
      "La dichiarazione di conformità (DM 37/08) è obbligatoria: mettila sempre in preventivo come voce, anche a costo zero, così il cliente sa che la riceve.",
    ],
    subject: "Rifacimento impianto elettrico appartamento (80 mq)",
    items: [
      { description: "Punti luce e punti presa", details: "Tracce, tubazioni, cavi e frutti serie civile standard, inclusa manodopera", quantity: 48, unit: "punti", unitPrice: 42, vatRate: 10 },
      { description: "Quadro elettrico e linee", details: "Quadro con interruttori magnetotermici e differenziali, linee dorsali, messa a terra", quantity: 1, unit: "a corpo", unitPrice: 650, vatRate: 10 },
      { description: "Punti TV, telefono e dati", details: "Cablaggio e prese", quantity: 6, unit: "punti", unitPrice: 55, vatRate: 10 },
      { description: "Dichiarazione di conformità DM 37/08", details: "Verifiche strumentali e certificazione dell'impianto", quantity: 1, unit: "a corpo", unitPrice: 180, vatRate: 10 },
    ],
    notes: "Esclusi: ripristini murari e tinteggiatura, corpi illuminanti, domotica. Serie civile a scelta tra i modelli standard; serie di design con supplemento. Pagamento con bonifico parlante per le detrazioni.",
    paymentTerms: PAY_50,
    tips: [
      "Specifica la serie dei frutti inclusa: è la prima cosa su cui il cliente chiede di cambiare.",
      "Elenca le esclusioni murarie: le tracce le fai tu, i ripristini no.",
      "IVA 10% in ristrutturazione residenziale, 22% altrove: controlla ogni voce.",
    ],
    faq: [
      { q: "Quanto costa rifare un impianto elettrico?", a: "Per un appartamento di 80-100 mq un impianto completo a norma costa 3.500-6.000 € più IVA al 10%, cioè 35-60 € a punto più quadro e certificazione." },
      { q: "La certificazione è inclusa?", a: "Deve esserlo: la dichiarazione di conformità è obbligatoria per legge. Mettila come voce esplicita." },
      { q: "Come gestisco i punti aggiunti in corso d'opera?", a: "Con il prezzo a punto già nel preventivo: ogni punto in più ha un costo chiaro, senza rinegoziare." },
    ],
  },
  {
    slug: "imbianchino",
    name: "Imbianchino",
    who: "imbianchini e decoratori",
    title: "Preventivo per imbianchino: tinteggiatura al mq e preparazione pareti",
    metaDescription:
      "Modello di preventivo per imbianchini: tinteggiatura interna al mq, rasatura, stuccatura, decorativi. IVA 10% per manutenzione, PDF in un minuto senza registrazione.",
    intro: [
      "La tinteggiatura si preventiva al metro quadro di superficie da dipingere, non di pavimento. Indica come l'hai calcolata e separa la preparazione (stuccatura, rasatura, carteggiatura) dalla pittura: è la preparazione che fa la differenza di prezzo tra due imbianchini.",
      "Specifica il tipo di pittura (lavabile, traspirante, antimuffa), le mani incluse e se la protezione di mobili e pavimenti è compresa.",
    ],
    subject: "Tinteggiatura interna appartamento (pareti e soffitti)",
    items: [
      { description: "Protezione ambienti e spostamento mobili", quantity: 1, unit: "a corpo", unitPrice: 150, vatRate: 10 },
      { description: "Preparazione pareti", details: "Stuccatura crepe, carteggiatura, fissativo", quantity: 280, unit: "mq", unitPrice: 3.5, vatRate: 10 },
      { description: "Tinteggiatura pareti e soffitti", details: "Pittura lavabile traspirante, 2 mani, colore a scelta dalla mazzetta", quantity: 280, unit: "mq", unitPrice: 6, vatRate: 10 },
      { description: "Smalto porte interne", details: "Carteggiatura e 2 mani di smalto all'acqua", quantity: 5, unit: "pz", unitPrice: 90, vatRate: 10 },
    ],
    notes: "Superficie calcolata su pareti e soffitti al netto delle aperture. Colori scuri o cambi colore tra ambienti possono richiedere una terza mano (supplemento 2 €/mq). Pittura inclusa; decorativi a parte.",
    paymentTerms: "Acconto del 30% all'inizio dei lavori, saldo a fine lavori.",
    tips: [
      "Spiega il calcolo della superficie: evita contestazioni sui metri quadri.",
      "Dichiara le mani incluse e il supplemento per la terza.",
      "Manutenzione ordinaria su abitazioni: IVA 10% sulla manodopera e sulla pittura fornita in opera.",
    ],
    faq: [
      { q: "Quanto costa tinteggiare al mq?", a: "La tinteggiatura di pareti e soffitti con pittura lavabile costa 5-9 € al mq con 2 mani; preparazione e rasatura 3-8 € al mq in più. Un appartamento di 80 mq costa in media 1.500-2.800 €." },
      { q: "IVA al 10% o 22%?", a: "La tinteggiatura in un'abitazione privata è manutenzione ordinaria: IVA 10%. Su uffici e negozi 22%." },
      { q: "Il colore influisce sul prezzo?", a: "I colori intensi coprono meno e richiedono una terza mano: indica il supplemento nel preventivo." },
    ],
  },
  {
    slug: "impresa-edile",
    name: "Impresa edile",
    who: "imprese edili e artigiani della ristrutturazione",
    title: "Preventivo impresa edile: ristrutturazione a voci con IVA 10%",
    metaDescription:
      "Modello di preventivo per imprese edili: demolizioni, impianti, massetti, pavimenti, opere murarie con IVA 10%, oneri di sicurezza e smaltimento. PDF immediato.",
    intro: [
      "Per una ristrutturazione il cliente confronta tre o quattro preventivi: vince quello che si capisce. Voci per lavorazione, quantità misurate, prezzi unitari, oneri di sicurezza e smaltimento esplicitati, esclusioni chiare. Un totale a corpo senza dettaglio viene scartato o tirato al ribasso.",
      "Indica l'aliquota IVA per voce: il 10% per ristrutturazioni su residenziale, con la regola dei beni significativi, e il 22% dove non si applica l'agevolazione.",
    ],
    subject: "Ristrutturazione completa appartamento (85 mq)",
    items: [
      { description: "Demolizioni e rimozioni", details: "Pavimenti, rivestimenti, tramezzi, impianti; trasporto e smaltimento in discarica autorizzata", quantity: 85, unit: "mq", unitPrice: 38, vatRate: 10 },
      { description: "Opere murarie", details: "Nuovi tramezzi in laterizio, intonaci, rasature", quantity: 1, unit: "a corpo", unitPrice: 6800, vatRate: 10 },
      { description: "Impianto elettrico e idraulico", details: "Come da preventivi di dettaglio degli installatori, certificazioni incluse", quantity: 1, unit: "a corpo", unitPrice: 9500, vatRate: 10 },
      { description: "Massetti e posa pavimenti", details: "Massetto alleggerito e posa gres fornito dal cliente, battiscopa incluso", quantity: 85, unit: "mq", unitPrice: 45, vatRate: 10 },
      { description: "Oneri per la sicurezza", details: "Apprestamenti di cantiere e DPI come da piano di sicurezza", quantity: 1, unit: "a corpo", unitPrice: 900, vatRate: 10 },
    ],
    notes: "Esclusi: pavimenti, rivestimenti e sanitari (forniti dal cliente), serramenti, porte, pratiche edilizie e progettazione, occupazione suolo pubblico. Durata lavori stimata: 10 settimane. Variazioni in corso d'opera concordate per iscritto.",
    paymentTerms: "30% all'inizio lavori, 40% a metà lavori (fine impianti), saldo a fine lavori con verbale di consegna.",
    tips: [
      "Metti gli oneri di sicurezza e lo smaltimento come voci: sono obbligatori e il cliente li vede altrove.",
      "Stati di avanzamento legati a milestone visibili: fine demolizioni, fine impianti, fine lavori.",
      "Esclusioni precise sulle forniture a carico del cliente.",
    ],
    faq: [
      { q: "Quanto costa ristrutturare un appartamento al mq?", a: "Una ristrutturazione completa con impianti costa 600-1.100 € al mq più IVA al 10%, esclusi finiture e arredi. Per 85 mq si parla di 50.000-90.000 €." },
      { q: "Il bonus ristrutturazione?", a: "Il cliente può detrarre una parte della spesa pagando con bonifico parlante; nel preventivo separa manodopera e forniture e indica l'IVA corretta per facilitare la pratica." },
      { q: "Come gestire le varianti?", a: "Solo per iscritto: una voce nelle note che rimanda a preventivi integrativi firmati evita contestazioni a fine cantiere." },
    ],
  },
  {
    slug: "giardiniere",
    name: "Giardiniere",
    who: "giardinieri e manutentori del verde",
    title: "Preventivo per giardiniere: manutenzione, potature e impianti",
    metaDescription:
      "Modello di preventivo per giardinieri: manutenzione annuale, potature, irrigazione e nuovi impianti. A canone o a intervento, PDF in un minuto senza registrazione.",
    intro: [
      "Il giardinaggio ha due mercati: la manutenzione ricorrente, da vendere a canone con un calendario di interventi, e i lavori una tantum come potature, impianti di irrigazione e nuove aiuole. Il preventivo deve dire quanti interventi l'anno, cosa include ogni intervento e cosa costa l'extra.",
      "Smaltimento del verde e noleggio di piattaforme per potature in quota sono voci separate: chiare in preventivo, mai sorprese in fattura.",
    ],
    subject: "Manutenzione annuale giardino (400 mq) e potatura alberi",
    items: [
      { description: "Manutenzione ordinaria del giardino", details: "Taglio prato, bordature, diserbo aiuole, controllo irrigazione: 20 interventi da marzo a novembre", quantity: 20, unit: "interventi", unitPrice: 75, vatRate: 22 },
      { description: "Potatura siepi", details: "2 potature l'anno, 35 metri lineari, smaltimento incluso", quantity: 2, unit: "interventi", unitPrice: 220, vatRate: 22 },
      { description: "Potatura alberi ad alto fusto", details: "3 alberi con piattaforma aerea, smaltimento ramaglie", quantity: 3, unit: "pz", unitPrice: 260, vatRate: 22 },
      { description: "Concimazione e trattamenti", details: "2 concimazioni del prato e 1 trattamento antifungino", quantity: 1, unit: "a corpo", unitPrice: 180, vatRate: 22 },
    ],
    notes: "Interventi programmati con cadenza quindicinale; in caso di maltempo l'intervento slitta alla settimana successiva. Smaltimento del verde incluso nelle voci indicate. Noleggio piattaforma incluso nella potatura alberi.",
    paymentTerms: "Canone fatturato trimestralmente in anticipo; potature a fine intervento. Bonifico a 30 giorni.",
    tips: [
      "Numero di interventi e calendario: così il canone è confrontabile e difendibile.",
      "Smaltimento e noleggi dichiarati: niente contestazioni.",
      "Per i condomini indica la cadenza e chi è il referente: il preventivo sarà discusso in assemblea.",
    ],
    faq: [
      { q: "Quanto costa la manutenzione di un giardino?", a: "Per un giardino di 300-500 mq con prato e siepi il canone annuo è 1.500-3.000 € più IVA con 15-20 interventi. La potatura di un albero adulto costa 150-400 € in base all'altezza." },
      { q: "IVA al 10% o 22%?", a: "La manutenzione del verde è di norma al 22%. Il 10% si applica solo a specifici interventi edilizi; verifica con il commercialista." },
      { q: "Meglio canone o a chiamata?", a: "Canone per i clienti abituali: lavoro pianificato, incassi regolari. A chiamata per potature e lavori straordinari." },
    ],
  },
  {
    slug: "personal-trainer",
    name: "Personal trainer",
    who: "personal trainer e istruttori",
    title: "Preventivo per personal trainer: pacchetti, allenamenti e piani",
    metaDescription:
      "Modello di preventivo per personal trainer: pacchetti di sessioni, piani di allenamento, coaching online, lezioni di gruppo. Prezzi di riferimento e PDF immediato.",
    intro: [
      "I personal trainer vendono pacchetti: 10 o 20 sessioni con una scadenza, piani di allenamento a distanza, percorsi mensili. Il preventivo scritto, anche per un privato, chiarisce durata delle sessioni, validità del pacchetto, politica per le cancellazioni e cosa succede alle sessioni non usate.",
      `Per le aziende (corporate wellness) e le palestre si aggiungono ritenuta d'acconto e fatturazione mensile: con ${BRAND} basta attivare le opzioni.`,
    ],
    subject: "Percorso di allenamento personalizzato (3 mesi)",
    items: [
      { description: "Valutazione iniziale", details: "Anamnesi, test funzionali, misurazioni, definizione obiettivi", quantity: 1, unit: "a corpo", unitPrice: 60 },
      { description: "Sessioni di personal training", details: "Sessioni da 60 minuti, 2 a settimana, in palestra o a domicilio entro 10 km", quantity: 24, unit: "sessioni", unitPrice: 45 },
      { description: "Piano di allenamento e nutrizionale di base", details: "Scheda mensile aggiornata, linee guida alimentari generali, supporto via chat", quantity: 3, unit: "mesi", unitPrice: 40 },
    ],
    notes: "Pacchetto valido 4 mesi dalla data di acquisto. Cancellazioni con meno di 24 ore di preavviso vengono conteggiate. Le sessioni non utilizzate alla scadenza decadono.",
    paymentTerms: "Pagamento anticipato del pacchetto alla conferma, anche in 3 rate mensili.",
    tips: [
      "Validità e cancellazioni scritte: il 90% dei problemi nasce da qui.",
      "Il piano nutrizionale è riservato a biologi e dietisti: offri solo linee guida generali, come nel modello.",
      "Per clienti privati niente ritenuta: IVA 22% o forfettario.",
    ],
    faq: [
      { q: "Quanto costa una sessione di personal training?", a: "In Italia 35-70 € a sessione da 60 minuti; i pacchetti da 10-20 sessioni abbassano il prezzo unitario del 10-20%. Il coaching online costa 60-150 € al mese." },
      { q: "Serve la Partita IVA per fare preventivi?", a: "Per attività continuativa sì. Molti personal trainer scelgono il regime forfettario: nel preventivo attiva l'opzione e il documento riporta la dicitura corretta." },
      { q: "Posso far accettare il preventivo online?", a: "Sì: invia il link, il cliente accetta e tu hai data e ora dell'accettazione." },
    ],
  },
  {
    slug: "wedding-planner",
    name: "Wedding planner",
    who: "wedding planner ed event planner",
    title: "Preventivo per wedding planner: coordinamento, fornitori e spese",
    metaDescription:
      "Modello di preventivo per wedding ed event planner: consulenza, progettazione, coordinamento del giorno e fornitori. Compenso separato dalle spese, PDF in un minuto.",
    intro: [
      "Il preventivo del wedding planner deve distinguere il compenso professionale dal budget dei fornitori: location, catering, fiori e musica li paga la coppia, tu vendi progettazione e coordinamento. Senza questa distinzione il cliente confonde il tuo onorario con il costo dell'evento.",
      "Definisci il livello di servizio (consulenza, parziale, completo, solo giorno del matrimonio) e il numero di incontri e sopralluoghi inclusi.",
    ],
    subject: "Organizzazione matrimonio: servizio completo",
    items: [
      { description: "Consulenza e progettazione", details: "Definizione stile e budget, timeline, selezione di 3 location e dei fornitori principali", quantity: 1, unit: "a corpo", unitPrice: 1500 },
      { description: "Gestione fornitori", details: "Richiesta preventivi, contratti, pagamenti e coordinamento fino al giorno dell'evento, fino a 12 fornitori", quantity: 1, unit: "a corpo", unitPrice: 1800 },
      { description: "Coordinamento del giorno del matrimonio", details: "Presenza di 2 persone per 14 ore, regia della giornata, gestione imprevisti", quantity: 1, unit: "a corpo", unitPrice: 1400 },
      { description: "Sopralluoghi e incontri aggiuntivi", details: "Oltre i 6 inclusi", quantity: 2, unit: "pz", unitPrice: 120 },
    ],
    notes: "Il budget dei fornitori (location, catering, fiori, musica, foto) è escluso e pagato direttamente dagli sposi. Spese di trasferta oltre 50 km rimborsate a piè di lista. Eventuali commissioni dei fornitori sono dichiarate e scontate agli sposi.",
    paymentTerms: "30% alla firma dell'incarico, 40% a 3 mesi dall'evento, saldo 15 giorni prima della data.",
    tips: [
      "Compenso e budget fornitori su righe diverse, o meglio in documenti diversi.",
      "Numero di incontri e sopralluoghi inclusi: il resto a tariffa.",
      "Scadenze di pagamento legate alla data dell'evento, non alla consegna.",
    ],
    faq: [
      { q: "Quanto costa un wedding planner?", a: "Il servizio completo costa in media il 10-15% del budget del matrimonio, con minimi di 3.000-5.000 €. Il solo coordinamento del giorno 800-1.500 €." },
      { q: "Devo fatturare anche i fornitori?", a: "Meglio di no: ogni fornitore fattura agli sposi e tu fatturi solo il tuo compenso. Se anticipi spese, trattale come rimborsi documentati." },
      { q: "Ritenuta d'acconto?", a: "Con i privati no. Con aziende (eventi corporate) sì, 20% sul compenso." },
    ],
  },
  {
    slug: "agenzia-web",
    name: "Agenzia web e marketing",
    who: "agenzie web, digital e di comunicazione",
    title: "Preventivo per agenzia web: progetti, canoni e campagne",
    metaDescription:
      "Modello di preventivo per agenzie web e marketing: sito, SEO, advertising e contenuti con canone mensile e progetto una tantum. Logo, colori e accettazione online.",
    intro: [
      "Un'agenzia vende un mix di progetti una tantum (sito, brand, campagna di lancio) e servizi ricorrenti (SEO, advertising, social, manutenzione). Il preventivo migliore li mostra in due blocchi: investimento iniziale e canone mensile, così il cliente valuta il totale del primo anno.",
      "Con più voci e più persone coinvolte, l'accettazione tracciata conta: invia il preventivo con un link, ricevi l'accettazione con data e ora e passa subito all'ordine.",
    ],
    subject: "Lancio digitale: sito, SEO e campagne (12 mesi)",
    items: [
      { description: "Progettazione e sviluppo sito web", details: "Sito corporate 10 pagine, design su misura, CMS, SEO tecnica, formazione", quantity: 1, unit: "a corpo", unitPrice: 6500 },
      { description: "Identità visiva e materiali", details: "Restyling logo, palette, template presentazioni e social", quantity: 1, unit: "a corpo", unitPrice: 2200 },
      { description: "SEO e contenuti", details: "Ottimizzazione continua, 4 contenuti al mese, report mensile", quantity: 12, unit: "mesi", unitPrice: 900 },
      { description: "Gestione campagne Google e Meta", details: "Strategia, creatività, ottimizzazione; budget media escluso", quantity: 12, unit: "mesi", unitPrice: 700 },
      { description: "Manutenzione e hosting gestito", quantity: 12, unit: "mesi", unitPrice: 90 },
    ],
    notes: "Budget media escluso, pagato dal cliente alle piattaforme. Canoni con durata minima 12 mesi, disdetta con 60 giorni di preavviso. Shooting fotografico e video non inclusi.",
    paymentTerms: "Progetti: 40% alla conferma, 60% alla messa online. Canoni: fatturazione mensile anticipata, bonifico a 30 giorni.",
    tips: [
      "Investimento iniziale e canone mensile in blocchi separati, con il totale del primo anno nelle note.",
      "Budget media escluso ed esplicitato.",
      "Usa il tuo colore e il logo nel PDF: il preventivo è il primo materiale di marketing che il cliente riceve.",
    ],
    faq: [
      { q: "Quanto costa un sito web da agenzia?", a: "Un sito corporate su misura da agenzia costa 5.000-15.000 € più IVA; e-commerce 10.000-40.000 €. I canoni SEO partono da 500 € al mese, l'advertising da 400 € più budget." },
      { q: "Il cliente può accettare online?", a: `Sì, con ${BRAND} il cliente apre il link, scarica il PDF e accetta con nome e data: l'agenzia riceve l'avviso via email.` },
      { q: "Ritenuta d'acconto per le agenzie?", a: "No: la ritenuta riguarda i compensi di lavoro autonomo. Le società di capitali fatturano senza ritenuta." },
    ],
  },
];

export function getProfession(slug: string): Profession | undefined {
  return professions.find((p) => p.slug === slug);
}

/** Items with deterministic ids, ready for a Quote. */
export function templateItems(p: Profession): LineItem[] {
  return p.items.map((it, i) => ({
    id: `${p.slug}-${i + 1}`,
    description: it.description,
    details: it.details,
    quantity: it.quantity,
    unit: it.unit,
    unitPrice: it.unitPrice,
    vatRate: it.vatRate ?? 22,
    discountPct: 0,
  }));
}

/** A fully deterministic example quote for the landing page and the sample PDF. */
export function sampleQuoteFor(p: Profession): Quote {
  const base = newQuote({
    id: `sample-${p.slug}`,
    number: "PRV-2026-021",
    date: "2026-10-08",
    createdAt: 1_791_000_000_000,
    updatedAt: 1_791_000_000_000,
    lang: "it",
    subject: p.subject,
    sender: { name: `${p.name} · Studio Esempio`, vat: "IT01234567890", address: "Via Roma 10", zip: "20121", city: "Milano", province: "MI", country: "Italia", email: "info@studioesempio.it" },
    client: { name: "Cliente S.r.l.", vat: "IT09876543210", address: "Corso Italia 5", zip: "10121", city: "Torino", province: "TO", country: "Italia" },
    items: templateItems(p),
    notes: p.notes,
    paymentTerms: p.paymentTerms,
  });
  return { ...base, options: { ...base.options, ...(p.options ?? {}) } };
}
