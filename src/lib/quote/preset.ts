import type { Quote, QuoteOptions } from "./types";

/**
 * Query-string presets used by the calculators and guide pages to open the
 * builder with the numbers already in place:
 *   /app?regime=forfettario&rivalsa=4&ritenuta=20&vat=22&amount=1000
 * rivalsa accepts a percentage or "cassa" (4% fund contribution, not withheld).
 */
const KEYS = ["regime", "rivalsa", "ritenuta", "vat", "amount"] as const;

export function hasPreset(params: URLSearchParams): boolean {
  return KEYS.some((k) => params.has(k));
}

function num(v: string | null): number | undefined {
  if (v === null) return undefined;
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

const pct = (n: number) => Math.min(100, Math.max(0, n));

export function applyPreset(quote: Quote, params: URLSearchParams): Quote {
  const o: QuoteOptions = { ...quote.options };
  const regime = params.get("regime");
  if (regime === "forfettario") {
    o.regimeForfettario = true;
    o.prestazioneOccasionale = false;
    o.ritenutaAccontoPct = 0;
  } else if (regime === "occasionale") {
    o.regimeForfettario = false;
    o.prestazioneOccasionale = true;
    o.rivalsaInpsPct = 0;
    o.ritenutaAccontoPct = 20;
  } else if (regime === "ordinario") {
    o.regimeForfettario = false;
    o.prestazioneOccasionale = false;
  }

  const rivalsa = params.get("rivalsa");
  if (rivalsa !== null && !o.prestazioneOccasionale) {
    if (rivalsa === "cassa") {
      o.rivalsaInpsPct = 4;
      o.rivalsaKind = "cassa";
    } else {
      const n = num(rivalsa);
      if (n !== undefined) {
        o.rivalsaInpsPct = pct(n);
        o.rivalsaKind = "inps";
      }
    }
  }

  const ritenuta = num(params.get("ritenuta"));
  if (ritenuta !== undefined && !o.regimeForfettario) o.ritenutaAccontoPct = pct(ritenuta);

  const vat = num(params.get("vat"));
  const amount = num(params.get("amount"));
  const items =
    vat === undefined && amount === undefined
      ? quote.items
      : quote.items.map((it, i) => ({
          ...it,
          vatRate: vat !== undefined ? pct(vat) : it.vatRate,
          ...(i === 0 && amount !== undefined ? { quantity: 1, unitPrice: Math.max(0, amount) } : {}),
        }));

  return { ...quote, items, options: o };
}
