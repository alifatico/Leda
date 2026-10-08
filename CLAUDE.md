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
