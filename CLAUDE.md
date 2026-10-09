# Preventivo Lampo — notes for future sessions

- Next.js 16 (App Router, Turbopack, `cacheComponents: true`), React 19, Tailwind v4, TypeScript strict.
- No database by design. Browser localStorage holds quotes; Stripe holds purchases; `src/lib/license.ts` signs HMAC tokens that prove entitlement.
- `src/lib/quote/calc.ts` is the fiscal engine: change it only with a matching test in `tests/calc.test.ts`.
- PDF = `src/lib/pdf/QuoteDocument.tsx` (react-pdf); `src/components/QuotePreview.tsx` must stay its visual twin.
- UI strings live in `src/lib/i18n/dict.ts` (`it` is the source; `en` is type-checked against it). Document labels (inside the PDF) are in `src/lib/quote/labels.ts`.
- Prerendered pages must not call `Date.now()` / `crypto.randomUUID()` during render (Cache Components). Use the sample quote with fixed ids/timestamps, or defer to effects.
- ESLint runs the React Compiler rules: no `setState` synchronously inside effects (use lazy init, `useSyncExternalStore`, or defer to a microtask), no components defined inside components.
- Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- Env vars are read only through `src/lib/env.ts`.
- Sharing ("Invia al cliente") is the only server-side state: `src/lib/store.ts` (Upstash REST or in-memory with `SHARE_STORE=memory`) + `src/lib/share.ts`. Public page `/p/[id]`, APIs under `/api/share`. Hidden when no store is configured.
- `src/lib/professions.ts` holds the SEO pages' content and templates; sample quotes there must stay deterministic (fixed ids and timestamps) because `/preventivo/[slug]` is prerendered.
- Comparison table and pricing copy in `dict.ts` cite competitor list prices checked in October 2026 (see `docs/COMPETITORS.md`); update both when prices change.
- Production runs on Vercel (team `alifaticos-projects`, project `preventivo-lampo`, https://preventivo-lampo-amber.vercel.app, functions in `fra1`); Stripe live catalog ids, env vars already set and what is still missing are listed in `docs/LAUNCH.md`.
- The product name lives in `src/lib/brand.ts` (`BRAND`); never hardcode it. "Preventivo Lampo" clashes with an existing app, see `docs/LAUNCH.md`.
- Fiscal regimes: `regimeForfettario`, `prestazioneOccasionale` (no VAT number: no VAT, withholding, no rivalsa) and `rivalsaKind` ("inps" is withheld, "cassa" is not) are all handled in `calc.ts`; the regime select is in `OptionsForm.tsx`.
- SEO content pages: `/strumenti/*` calculators and `/preventivo-forfettario`, `/preventivo-prestazione-occasionale`, `/come-fare-un-preventivo` use `src/components/ContentPage.tsx` + `FiscalCalculator` (deterministic quote, reuses `computeTotals`). Query presets for the builder: `src/lib/quote/preset.ts`.
