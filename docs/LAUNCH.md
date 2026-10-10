# Checklist di lancio — Preventivo Lampo

Obiettivo: primi 100 € nel mese 1, 300–1.000 €/mese entro 6 mesi, con costi fissi limitati all'hosting (il piano Hobby di Vercel non ammette uso commerciale: serve Vercel Pro o un host equivalente).

## Stripe live: già configurato il 9 ottobre 2026

Account `acct_1UOYYfPFKsiVAwzR` (Italia). Oggetti creati via API, modalità live:

| Oggetto | ID | Note |
| --- | --- | --- |
| Prodotto "Preventivo PDF" | `prod_VPObSQN3pQQiKO` | una tantum |
| Prezzo singolo 4,90 € | `price_1UOZoqPFKsiVAwzRTw5zFvO7` | lookup key `preventivo_lampo_single_490`, IVA inclusa |
| Prodotto "Preventivo Lampo Pro" | `prod_VPOb9C3BcJui42` | abbonamento |
| Prezzo Pro mensile 9 € | `price_1UOZoqPFKsiVAwzRyziMzjj0` | lookup key `preventivo_lampo_pro_monthly_900` |
| Prezzo Pro annuale 59 € | `price_1UOZoqPFKsiVAwzRN08eCMSv` | lookup key `preventivo_lampo_pro_yearly_5900` |
| Customer Portal | `bpc_1UOZoqPFKsiVAwzRz4ajvCKA` | predefinito: disdetta a fine periodo, cambio carta, fatture, aggiornamento dati e P.IVA |

Variabili d'ambiente da impostare su Vercel per usare questo catalogo (solo con la chiave live):

```
STRIPE_SECRET_KEY=sk_live_…            # solo tu puoi copiarla dal dashboard
STRIPE_PRICE_SINGLE=price_1UOZoqPFKsiVAwzRTw5zFvO7
STRIPE_PRICE_PRO_MONTHLY=price_1UOZoqPFKsiVAwzRyziMzjj0
STRIPE_PRICE_PRO_YEARLY=price_1UOZoqPFKsiVAwzRN08eCMSv
STRIPE_PORTAL_CONFIGURATION=bpc_1UOZoqPFKsiVAwzRz4ajvCKA
```

Con una chiave di test (`sk_test_…`) lascia vuote le variabili `STRIPE_PRICE_*`: l'app crea i prezzi al volo. Il nome pubblico dell'account Stripe risulta "PreventivoFacile": allinealo a "Preventivo Lampo" in Stripe → Settings → Public details, perché compare su ricevute ed estratti conto, e "Preventivi Facili" è già il nome di un'app concorrente.

## Vercel: progetto creato il 9 ottobre 2026

Team `alifaticos-projects` (piano Hobby), progetto `preventivo-lampo` (`prj_lj7tX1ddvzNhCAZl9ZrtseCwVy6y`) collegato al repo GitHub `alifatico/Leda`, Node 24, funzioni nella regione `fra1` (Francoforte).

- URL pubblico: https://preventivo-lampo-amber.vercel.app. È anche `VERCEL_PROJECT_PRODUCTION_URL`, quindi `appUrl()`, sitemap e redirect di Stripe puntano lì finché non c'è un dominio custom.
- Variabili già impostate: `LICENSE_SECRET` (production + preview, sensibile), `STRIPE_PRICE_SINGLE`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, `STRIPE_PORTAL_CONFIGURATION`, `BUSINESS_NAME`, `SUPPORT_EMAIL` (production).
- Mancano e le può aggiungere solo il titolare da Settings → Environment Variables: `STRIPE_SECRET_KEY` (senza, `/api/config` risponde `payments: false` e si scarica solo il PDF con filigrana), `ANTHROPIC_API_KEY`, Upstash Redis dal marketplace (abilita "Invia al cliente"), `RESEND_API_KEY`, `APIFY_TOKEN` o `OPENAPI_COMPANY_TOKEN` (abilitano la ricerca del cliente nel Registro Imprese, vedi la checklist), le altre `BUSINESS_*`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`.
- Dopo ogni modifica alle variabili serve un nuovo deploy (Deployments → ⋯ → Redeploy): vengono lette al build, non al volo.
- Branch di produzione: `master` (dal 10 ottobre 2026 allineato al branch di lavoro con merge fast-forward). Ogni push su `master` fa partire il deploy di produzione automatico di Vercel; i branch di lavoro producono deploy di anteprima.
- Il piano Hobby vieta l'uso commerciale: passare a Pro prima di incassare.

## Nome: da cambiare prima del lancio

"Preventivo Lampo" è già un'app mobile concorrente (preventivolampo.it, Pro 9,99 €/mese) e i domini preventivolampo.it/.com/.eu sono presi. Il nome è centralizzato in `src/lib/brand.ts` (`BRAND`): cambiarlo lì, poi dominio (`APP_URL`), `BUSINESS_NAME` su Vercel, nome pubblico e prodotti su Stripe. Domini liberi verificati su Vercel il 9 ottobre 2026 (11,25 $/anno, solo .com; tutti i .it corrispondenti sono occupati): preventivopdf.com, preventivonetto.com, preventivissimo.com, preventivosemplice.com, preventivopronto.com, preventivozero.com, facciopreventivo.com, preventivoinunminuto.com. Anche preventivolampo.app (14,99 $) è libero ma mantiene il clash.

## Traffico senza intervento manuale (costruito il 9 ottobre 2026)

- Loop di prodotto: il PDF gratuito ha un link al sito nel piè di pagina (`utm_source=pdf`), la pagina pubblica del preventivo ha il box "Serve un preventivo anche a te?" (`utm_source=share`).
- Calcolatori che attirano link: `/strumenti/calcolo-ritenuta-acconto`, `/strumenti/calcolo-rivalsa-inps`, `/strumenti/imposta-di-bollo-2-euro`; ognuno apre il builder con i numeri (`/app?regime=…&amount=…&rivalsa=…&ritenuta=…&vat=…`, vedi `src/lib/quote/preset.ts`).
- Guide per le query scoperte: `/preventivo-forfettario`, `/preventivo-prestazione-occasionale`, `/come-fare-un-preventivo`; tutte con FAQ e breadcrumb in JSON-LD, linkate dal footer e dalle pagine professione.
- Motore: modalità "prestazione occasionale" (niente IVA, ritenuta 20%, bollo, diciture) e distinzione rivalsa INPS / contributo integrativo di cassa (fuori dalla ritenuta), con test.
- Prossimi contenuti a costo zero: pagine per città sulle professioni artigiane solo quando le pagine professione portano traffico; 3 articoli "come fare un preventivo per <settore>" linkati dalle guide.

## Editor del modello: gratis, con filigrana (10 ottobre 2026)

Decisione: tutta la personalizzazione del documento è nel piano gratuito; si paga solo il PDF senza filigrana (singolo o Pro). Motivo: FaiPreventivo include 36 modelli e 28 copertine dal piano Starter, Fatture in Cloud ha 10+ modelli in ogni piano, Zoho e Canva regalano la personalizzazione; farla pagare non differenzia, mentre un editor gratuito con il motore fiscale sotto è l'unica cosa che oggi nessuno offre in italiano.

- Cinque stili (`src/lib/quote/styles.ts`): classico, moderno (banda), essenziale (solo linee), elegante (serif, titolo centrato), compatto.
- Modello modificabile (`quote.design`): colonne, etichette, testo introduttivo, testo finale, copertina con immagine, firma e validità.
- Modelli salvati dall'utente nel browser (`templatesStore`), riutilizzabili da "I miei preventivi".
- Prossimo passo coerente: pagine SEO "modello preventivo <stile>" e la copertina come gancio per agenzie e consulenti (proposte).

## Giorno 0 — mettere in produzione (1 ora)

- [x] Progetto Vercel creato, variabili non segrete impostate, primo deploy di produzione online (vedi sopra).
- [ ] Nome nuovo e dominio (vedi sopra) → Vercel; poi Search Console con `GOOGLE_SITE_VERIFICATION`.
- [ ] Stripe live: chiave `sk_live_…` su Vercel (catalogo e portale già creati, vedi sopra), ricevute email attive (Settings → Emails).
- [ ] Variabili `BUSINESS_*`, `SUPPORT_EMAIL`: compaiono in footer, privacy e termini (obbligatorie per vendere online in Italia).
- [ ] Pagamento di prova reale da 4,90 € con la tua carta, poi rimborso dal dashboard.
- [ ] Google Search Console + Plausible (`NEXT_PUBLIC_PLAUSIBLE_DOMAIN`).
- [ ] `ANTHROPIC_API_KEY` con limite di spesa mensile impostato nella console Anthropic.
- [ ] Upstash Redis dal marketplace Vercel (gratis): senza, il pulsante "Invia al cliente" non compare.
- [ ] `RESEND_API_KEY` + dominio verificato: serve per gli avvisi di accettazione e per il recupero della chiave Pro.
- [ ] Ricerca del cliente nel Registro Imprese, una delle due:
  - **Per ora: Apify** (nessuna ricarica, piano Free con 5 $ di credito al mese, senza carta). Account su console.apify.com → Settings → API & Integrations → token; su Vercel `APIFY_TOKEN` (e `COMPANY_LOOKUP=apify` se c'è anche il token openapi). Actor `jungle_synthesizer/italy-registroimprese-bilanci-scraper`: prezzi verificati il 9 ottobre 2026, $0,0001 ad avvio + $0,006 a record sul piano Free (il "da $4,80/1000" vale solo per il livello Gold); con `APIFY_COMPANY_MAX_ITEMS=5` circa $0,03 a ricerca, cioè ~150 ricerche al mese gratis, poi piano Starter da 29 $/mese. Limiti da sapere: legge ufficiocamerale.it (un rivenditore privato) tramite gli indici della Wayback Machine, quindi copertura parziale e dati non garantiti aggiornati; ogni ricerca è un run di qualche decina di secondi (pulsante, non suggerimenti mentre si scrive); 93% di run riusciti negli ultimi 30 giorni. `COMPANY_LOOKUP_DAILY_LIMIT` (default 300) è il tetto di run al giorno.
  - **Quando conviene: openapi.com** (`OPENAPI_COMPANY_TOKEN`, token con scope `company`, ricarica minima del wallet 50 €). Autocomplete €0,001 a chiamata (100 gratuite al giorno), scheda `IT-start` €0,015 (30 gratuite al mese), IVA esclusa; circa 2 centesimi a cliente, suggerimenti in tempo reale mentre si scrive e dati ufficiali. Basta impostare il token: ha la precedenza su Apify.
  - Senza token il campo cliente usa solo la rubrica del browser.

## Settimana 1 — distribuzione a costo zero

1. **SEO long-tail (il canale principale).** Keyword con intento alto e concorrenza bassa, da trasformare in pagine o sezioni della landing:
   - "preventivo pdf", "modello preventivo", "fac simile preventivo", "preventivo online gratis"
   - "preventivo forfettario", "preventivo con ritenuta d'acconto", "preventivo rivalsa inps 4%"
   - "preventivo freelance", "preventivo grafico / fotografo / consulente / web designer"
   Già online: 20 pagine `/preventivo/<professione>` con modelli precompilati e `/preventivo-ai`. Prossimo passo: pagine per città sulle professioni artigiane (idraulico Milano, elettricista Roma…) solo se le pagine professione portano traffico, per non creare contenuti sottili.
2. **Community**: gruppi Facebook/LinkedIn di freelance e partite IVA, r/ItalyInformatica, forum commercialisti. Formato: "ho fatto uno strumento gratis che calcola rivalsa e ritenuta nel preventivo", non pubblicità.
3. **Product Hunt / Indie Hackers**: lancio in inglese, angolo "no-signup, stateless, Stripe-only SaaS".
4. **Lista contatti dell'agenzia**: email ai clienti e partner freelance con il link all'esempio PDF.
5. **Commercialisti**: 10 email a studi che seguono forfettari. Offri Pro gratis 1 anno in cambio di una menzione ai clienti.

## Metriche da guardare (Plausible + Stripe)

| Metrica | Obiettivo iniziale |
| --- | --- |
| Visite → /app | > 40% |
| /app → PDF di prova scaricato | > 30% |
| PDF di prova → pagamento | 3–8% |
| Singolo → Pro (upsell nel paywall) | 10–20% |
| Churn mensile Pro | < 8% |

Se il tasso "prova → pagamento" è sotto il 3 %: abbassa il singolo a 2,90 € o aggiungi un pacchetto "5 preventivi a 14,90 €" (richiede solo un nuovo `PlanId` e un token con contatore).

## Leve di prezzo già pronte

- Tutti i prezzi sono variabili d'ambiente (`PRICE_*_CENTS`): cambia e rideploya, nessun codice.
- Codici sconto: Stripe → Product catalog → Coupons; il Checkout accetta già i codici promozionali.
- Prezzi regionali o in altre valute: crea Prezzi nel dashboard e usa `STRIPE_PRICE_*`.

## Roadmap suggerita (ordine di impatto)

1. Blog "come fare un preventivo" (3 articoli) che linka le pagine per professione.
2. Promemoria automatico al cliente che non ha ancora risposto dopo 3 giorni (il link è già tracciato).
3. Conversione preventivo → fattura (export XML per fattura elettronica è un upsell naturale).
4. Modelli salvati dall'utente (voci ricorrenti) e catalogo prodotti.
5. Versione white-label per agenzie e commercialisti (Pro Team).

Le scelte di prezzo e posizionamento rispetto ai concorrenti sono motivate in `docs/COMPETITORS.md`.

## Note legali rapide

- Il PDF è un preventivo, non un documento fiscale: nessun obbligo di bollo o numerazione.
- Vendita a consumatori: i Termini già includono la rinuncia al recesso per contenuto digitale fornito subito (art. 59 Codice del Consumo).
- IVA sulle vendite: se non usi Stripe Tax, i prezzi sono considerati IVA inclusa; verifica con il commercialista il regime applicabile (OSS per clienti UE).
