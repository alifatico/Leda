# Analisi dei concorrenti — ottobre 2026

Fonti: pagine ufficiali e confronti pubblici consultati l'8 ottobre 2026 (link in fondo). I prezzi cambiano: verificare prima di usarli in comunicazioni commerciali.

## Mappa del mercato italiano

| Cluster | Esempi | Prezzo | Punti di forza | Lacune rispetto a noi |
| --- | --- | --- | --- | --- |
| Gestionali di fatturazione con preventivi inclusi | Fatture in Cloud (leader, TeamSystem), Aruba, Fattura24, FattureGB, Qonto, SumUp, Finom, ProFattura | FiC Forfettari 4 €/mese il primo anno poi 8 €/mese + IVA; Standard 12 €/mese; preventivi inclusi ma contano nel tetto di 100 documenti/anno | Fattura elettronica, conversione preventivo → fattura, app, archivio clienti, firma online (ProFattura) | Nessuna bozza AI; serve registrarsi e configurare un gestionale anche per un solo preventivo |
| App preventivi "pure" | Preventivi Facili (mobile), Billdu, SpeedInvoice, Invoice Home, PayPal Business, Canva | Gratis fino a 4 preventivi, poi 7,99 €/mese o 48,99 €/anno; altri da 5,80 €/mese | App native, template | Nessuna specificità fiscale italiana, nessuna AI |
| Preventivi con AI (nicchia nata nel 2025-26) | **FaiPreventivo**, **PrevAI**, **PreventivAI**, **PreventivIA** | FaiPreventivo: Starter 8,99 €/mese senza AI, Professional 11,99 € con 10 bozze/mese, Unlimited 20,99 €; prova 6 giorni con PDF bloccato. PrevAI: 19/49/79 €/mese per 10/60/illimitati, singolo ~29 €. PreventivAI: 1,99 € + IVA a preventivo o 9,90 €/mese via WhatsApp. PreventivIA: 29-49 €/mese | Firma/accettazione online, fattura elettronica (FaiPreventivo), WhatsApp con voce e foto (PrevAI, PreventivAI), landing SEO per mestiere e città (PrevAI) | Registrazione obbligatoria, prezzi alti, AI a contatore, quasi tutti orientati agli artigiani: niente rivalsa INPS né ritenuta d'acconto |
| **Preventivo Lampo (app mobile, preventivolampo.it)** | App iOS/Android, stesso nome e stesso claim ("preventivi professionali in 60 secondi") | Gratis 5 preventivi/mese, Pro 9,99 €/mese o 79,99 €/anno | Link tracciati, firma, WhatsApp, clienti | **Clash di nome e domini (.it, .com, .eu presi): il nostro prodotto va rinominato prima del lancio** |
| Generatori gratuiti senza registrazione (mercato inglese) | ClickUp, Holdings, Formester, Ragic, Silkquote, **Portant** (anche in italiano, senza filigrana, un solo campo "aliquota"), Ueni, Invoice Fly, ToolsLoop | Gratis, senza filigrana | Zero attrito, domini con autorità | Nessuna fiscalità italiana, nessuna AI, upsell alle loro suite (Portant → automazione Google Workspace/HubSpot) |
| Sostituti | Modelli Word/Excel (partitaiva.it, Qonto, Jotform, Microsoft Create) | Gratis | Dominano Google su "preventivo online gratis" | Calcoli a mano, nessun invio/accettazione |

## Cosa ne abbiamo ricavato

1. **Posizionamento**: unici senza registrazione e con PDF singolo sotto i 5 €. Tutti i concorrenti italiani chiedono un account; FaiPreventivo blocca il PDF finché non paghi. → tabella di confronto in landing.
2. **AI gratuita**: la bozza AI è venduta a 11,99 €/mese (10 bozze) o 19 €/mese (10 preventivi). Noi la includiamo nel piano gratuito: costa centesimi per bozza. → pagina `/preventivo-ai`.
3. **Segmento**: gli artigiani sono contesi da quattro prodotti AI; i professionisti (consulenti, designer, sviluppatori, architetti) no. Nessun concorrente AI gestisce rivalsa INPS, ritenuta d'acconto e contributi di cassa. → 20 pagine per professione, opzione "dicitura della rivalsa" (Inarcassa, Cassa Forense…).
4. **Lacuna principale colmata**: invio con link e accettazione online, presente in FaiPreventivo, PrevAI e ProFattura. → `/api/share` + `/p/<id>`, incluso nel PDF singolo e in Pro.
5. **Prezzi**: il singolo a 4,90 € sta tra 1,99 € + IVA (PreventivAI, solo WhatsApp) e ~29 € (PrevAI). Il Pro a 9 €/mese è allineato a FaiPreventivo Starter (8,99 €, senza AI) e a Fatture in Cloud Forfettari (8 €/mese dal secondo anno, con fattura elettronica): resta a 9 € perché include AI e invio illimitati; da rivalutare con i dati di conversione (vedi LAUNCH.md).
6. **Da copiare da PrevAI**: landing per mestiere (fatto) e per città (solo se le pagine professione portano traffico).

## Dove si vince su Google (verifica del 9 ottobre 2026)

| Query | Chi domina | Per noi |
| --- | --- | --- |
| "generatore preventivi", "preventivo online gratis" | Fatture in Cloud, Jotform, Manus, Portant | No per 6-12 mesi: dominio nuovo contro domini con autorità e tool senza filigrana |
| "fac simile preventivo", "modello preventivo" | partitaiva.it, Jotform | Difficile; i fac simile PDF per professione aiutano |
| "preventivo forfettario", "rivalsa INPS preventivo", "ritenuta d'acconto preventivo" | Solo articoli (Fiscozen, Fiscomania, QuiFinanza, PMI.it), nessuno strumento | Sì: pagine `/preventivo-forfettario`, `/strumenti/*` con calcolatori che aprono il builder |
| "preventivo prestazione occasionale" | Fac simile statici | Sì: `/preventivo-prestazione-occasionale` + modalità dedicata nel motore |
| "preventivo <professione>" | Post di blog | Sì: le 20 pagine `/preventivo/<slug>` hanno il tool dentro |

## Personalizzazione del documento (verifica del 10 ottobre 2026)

| Concorrente | Cosa offre | Dove |
| --- | --- | --- |
| FaiPreventivo | 36 modelli, 28 copertine, stili con nome (font, colori, tabella, totali, firma); niente editor né campi custom | Tutti i piani a pagamento, da 8,99 €/mese |
| Fatture in Cloud | 10+ modelli, logo, colore, font, note a piè di pagina; editor HTML del modello | Editor solo Premium / Premium Plus |
| PrevAI | Nessun modello, layout fisso con logo | 19-79 €/mese |
| Zoho Invoice, Canva | Logo, colori, font, etichette, coordinate bancarie; Canva libertà totale senza calcoli | Gratis |
| PandaDoc, Proposify, Qwilr | Proposte editabili con copertina, sezioni, firma | 19-49 $/utente/mese, solo in inglese |

Conclusione: scegliere uno stile è lo standard, non un vantaggio. Il vantaggio è il documento modificabile (copertina, lettera, etichette, colonne, modelli salvati) con il motore fiscale e il link di accettazione, gratis: nessun concorrente italiano lo offre sotto i 19 €/mese.

## Rischi

- Fatture in Cloud o FaiPreventivo potrebbero aggiungere un piano "solo preventivi" o la bozza AI gratuita: il nostro vantaggio difendibile resta l'assenza di attrito (zero registrazione, 60 secondi al PDF) e i contenuti SEO per professione.
- I generatori gratuiti inglesi non hanno filigrana: un utente informato può ottenere un PDF gratis altrove, ma senza fiscalità italiana né accettazione.

## Fonti

- FaiPreventivo: https://faipreventivo.it/ e https://faipreventivo.it/preventivo-ai-gratis
- PrevAI: https://www.prevai.it/
- PreventivAI: https://preventivai.com/
- PreventivIA: https://preventivia.it/
- Fatture in Cloud: https://www.fattureincloud.it/costo/ , https://www.fattureincloud.it/forfettari/ , https://www.fattureincloud.it/software-fatturazione/preventivi/
- ProFattura: https://www.producthunt.com/products/profattura
- App mobile (Preventivi Facili, Billdu, SpeedInvoice…): https://www.aranzulla.it/app-per-preventivi-gratis-1615453.html
- Zoho Invoice: https://www.zoho.com/it/invoice/pricing/
- Qonto: https://qonto.com/it/invoicing/quotes
- Confronti software 2026: https://www.fiscozen.it/guide/migliori-software-fatturazione-elettronica-2026/ , https://centrofiscale.com/gestionale-partita-iva-2026/ , https://www.pazienza.app/blog/fattura-elettronica-prezzi-a-confronto/
- Preventivo Lampo (app omonima): https://preventivolampo.it/
- Portant: https://www.portant.co/it/quote-generator/
- Generatori gratuiti: https://clickup.com/free-tools/quote-generator , https://ueni.com/tools/ , https://getholdings.com/tools/quote-generator , https://formester.com/tools/business-quote-generator , https://www.ragic.com/intl/en/product-quotation-generator
