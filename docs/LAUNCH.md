# Checklist di lancio — Preventivo Lampo

Obiettivo: primi 100 € nel mese 1, 300–1.000 €/mese entro 6 mesi, con costi fissi limitati all'hosting (il piano Hobby di Vercel non ammette uso commerciale: serve Vercel Pro o un host equivalente).

## Giorno 0 — mettere in produzione (1 ora)

- [ ] Dominio: `preventivolampo.it` (o `.com`) → Vercel. Verifica disponibilità e marchio prima di registrare.
- [ ] Stripe live: chiave `sk_live_…`, Customer Portal attivo, ricevute email attive (Settings → Emails).
- [ ] Variabili `BUSINESS_*`, `SUPPORT_EMAIL`: compaiono in footer, privacy e termini (obbligatorie per vendere online in Italia).
- [ ] Pagamento di prova reale da 4,90 € con la tua carta, poi rimborso dal dashboard.
- [ ] Google Search Console + Plausible (`NEXT_PUBLIC_PLAUSIBLE_DOMAIN`).
- [ ] `ANTHROPIC_API_KEY` con limite di spesa mensile impostato nella console Anthropic.
- [ ] Upstash Redis dal marketplace Vercel (gratis): senza, il pulsante "Invia al cliente" non compare.
- [ ] `RESEND_API_KEY` + dominio verificato: serve per gli avvisi di accettazione e per il recupero della chiave Pro.

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
