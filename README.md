# ⚡ Preventivo Lampo

**Preventivi professionali in PDF in 60 secondi** — un micro-SaaS pronto a incassare.

Chi ha una Partita IVA fa preventivi ogni settimana, di solito con Word o Excel: i calcoli (rivalsa INPS, ritenuta d'acconto, IVA per aliquota, bollo, regime forfettario) sono noiosi e si sbagliano. Preventivo Lampo li fa in automatico, l'AI scrive le voci, il PDF esce pulito con logo e colore del professionista.

**Modello di business**

| Piano | Prezzo | Cosa sblocca |
| --- | --- | --- |
| Gratis | 0 € | Preventivi illimitati nel browser, PDF con filigrana "ANTEPRIMA" |
| Singolo | 4,90 € una tantum | PDF pulito di quel preventivo, riscaricabile dopo le modifiche |
| Pro | 9 €/mese o 59 €/anno | PDF illimitati, portale Stripe per gestire l'abbonamento |

Nessun database, nessun account: i preventivi vivono nel browser dell'utente, Stripe è l'unica fonte di verità per i pagamenti e il server rilascia **token firmati** (HMAC) come prova di acquisto. Costi fissi: solo l'hosting (Vercel Pro 20 $/mese per uso commerciale, oppure Railway/Fly.io/un VPS da pochi euro) più le commissioni Stripe per transazione.

---

## Deploy in 10 minuti

1. **Stripe** — crea un account su [stripe.com](https://stripe.com), attiva il *Customer Portal* (Settings → Billing → Customer portal → Save) e copia la *Secret key* (`sk_test_…` per provare, `sk_live_…` per incassare).
2. **Vercel** — importa questo repository su [vercel.com/new](https://vercel.com/new), aggiungi la variabile `STRIPE_SECRET_KEY` e fai deploy. Non serve altro: l'URL pubblico viene rilevato da solo.
3. **Prova il flusso** con la carta di test `4242 4242 4242 4242`: crea un preventivo, clicca *Scarica PDF*, paga, torna sulla pagina di successo e il PDF pulito si scarica da solo.
4. **Vai live**: sostituisci la chiave con `sk_live_…` e compila `BUSINESS_*` e `SUPPORT_EMAIL` (compaiono nel footer e nelle pagine legali).

Opzionali ma consigliati:

- `ANTHROPIC_API_KEY` → attiva *Bozza con AI* (descrivi il lavoro → voci, prezzi e condizioni). Costo per bozza nell'ordine dei centesimi; `AI_DAILY_LIMIT` limita la spesa.
- `RESEND_API_KEY` → recupero della chiave Pro via email ("ho perso la chiave").
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` → statistiche senza cookie.
- `STRIPE_PRICE_*` → usa Prezzi creati nel dashboard Stripe invece di quelli ad-hoc.

Tutte le variabili sono documentate in [`.env.example`](.env.example).

## Sviluppo locale

```bash
npm install
cp .env.example .env.local   # compila almeno STRIPE_SECRET_KEY per provare i pagamenti
npm run dev                  # http://localhost:3000
npm test                     # calcoli fiscali, token di licenza, rendering PDF
npm run lint && npm run typecheck
npm run build && npm start   # build di produzione
```

Per i pagamenti in locale non servono webhook: la pagina `/success` verifica la sessione Checkout direttamente con l'API di Stripe.

## Come funziona

```
Browser (localStorage)                      Server (Next.js route handlers, stateless)
┌─────────────────────────┐   POST /api/pdf {quote, unlock|license}   ┌─────────────────────────┐
│ preventivi, profilo,    │ ───────────────────────────────────────▶ │ zod → calcoli → react-pdf│
│ chiave Pro              │ ◀─────────────────────────────────────── │ filigrana se non pagato  │
└─────────────────────────┘             application/pdf              └─────────────────────────┘
          │  POST /api/checkout {plan, docId}                                   │
          ▼                                                                     ▼
   Stripe Checkout ──▶ /success?session_id=… ──▶ GET /api/checkout/verify ──▶ token HMAC
                                                     (single: legato al docId · pro: valido fino a fine periodo)
```

- **Singolo**: il token sblocca *quel* documento (`docId`), per sempre, anche dopo modifiche.
- **Pro**: il token scade a fine periodo di fatturazione (+3 giorni di grazia); l'app lo rinnova da sola chiamando `/api/license/refresh`, che controlla lo stato dell'abbonamento su Stripe. Disdetta → nessun rinnovo.
- **Recupero chiave**: `/api/license/recover` cerca l'email tra i clienti Stripe con abbonamento attivo e invia una nuova chiave (risposta identica in ogni caso: niente enumerazione di email).
- **Rate limiting** in memoria su tutte le API (PDF, checkout, AI, recupero).

### Struttura

```
src/
  app/                 pagine (landing, /app, /success, /privacy, /termini) e API in app/api/*
  components/          UI: builder/*, QuotePreview (gemello HTML del PDF), Landing, …
  lib/quote/           modello, calcoli (calc.ts), schema zod, etichette documento it/en
  lib/pdf/             documento react-pdf + sanitizzazione caratteri
  lib/stripe.ts        Checkout, verifica sessione, abbonamenti, portale
  lib/license.ts       token HMAC (single/pro)
  lib/ai.ts            bozza con Claude (output strutturato via zod)
  lib/i18n/            dizionari UI it/en
tests/                 vitest
```

### Calcoli fiscali supportati

Sconti di riga e globale · IVA per aliquota (22/10/5/4/0) · rivalsa INPS 4% (soggetta a IVA e a ritenuta) · ritenuta d'acconto 20% (su imponibile + rivalsa, mai sull'IVA) · imposta di bollo 2 € sugli importi esenti > 77,47 € · regime forfettario (IVA 0, niente ritenuta, dicitura L. 190/2014) · acconto in percentuale. Tutto coperto da test in `tests/calc.test.ts`.

## Lancio e crescita

La checklist operativa (SEO, canali, prezzi, metriche) è in [`docs/LAUNCH.md`](docs/LAUNCH.md).

## Licenza

Codice proprietario — tutti i diritti riservati.
