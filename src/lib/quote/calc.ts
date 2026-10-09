import { BOLLO_AMOUNT, BOLLO_THRESHOLD } from "./defaults";
import type { LineItem, LineTotals, Quote, Totals, VatGroup } from "./types";

export function round2(n: number): number {
  // Round half away from zero on the cents, robust to float noise
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function clampPct(n: number | undefined): number {
  if (!Number.isFinite(n as number)) return 0;
  return Math.min(100, Math.max(0, n as number));
}

function safeNum(n: number | undefined): number {
  return Number.isFinite(n as number) ? (n as number) : 0;
}

/**
 * Compute every amount shown on the document.
 *
 * Italian specifics handled here:
 *  - rivalsa INPS (4%): added on top of the net amount and subject to VAT
 *  - contributo integrativo di cassa (rivalsaKind "cassa"): like the rivalsa but
 *    excluded from the withholding base
 *  - ritenuta d'acconto (20%): withheld by the client on net (+ INPS rivalsa), never on VAT
 *  - imposta di bollo (€2): due when the VAT-exempt amount exceeds €77.47
 *  - regime forfettario: forces VAT 0 and no withholding
 *  - prestazione occasionale (no VAT number): forces VAT 0 and no rivalsa, withholding applies
 */
export function computeTotals(quote: Quote): Totals {
  const o = quote.options;
  const forfettario = o.regimeForfettario;
  const occasionale = !forfettario && Boolean(o.prestazioneOccasionale);
  const noVat = forfettario || occasionale;
  const globalPct = clampPct(o.globalDiscountPct);
  const rivalsaPct = occasionale ? 0 : clampPct(o.rivalsaInpsPct);
  const ritenutaPct = forfettario ? 0 : clampPct(o.ritenutaAccontoPct);
  const rivalsaWithheld = (o.rivalsaKind ?? "inps") === "inps";

  const lines: LineTotals[] = quote.items.map((it: LineItem) => {
    const qty = safeNum(it.quantity);
    const price = safeNum(it.unitPrice);
    const gross = qty * price;
    const net = gross * (1 - clampPct(it.discountPct) / 100);
    const netAfterGlobal = net * (1 - globalPct / 100);
    const rivalsa = netAfterGlobal * (rivalsaPct / 100);
    const vatRate = noVat ? 0 : clampPct(it.vatRate);
    const vatBase = netAfterGlobal + rivalsa;
    const vat = vatBase * (vatRate / 100);
    return {
      id: it.id,
      gross: round2(gross),
      net: round2(net),
      netAfterGlobal,
      rivalsa,
      vatRate,
      vatBase,
      vat,
    };
  });

  const subtotal = round2(lines.reduce((s, l) => s + l.gross, 0));
  const afterLine = lines.reduce((s, l) => s + l.net, 0);
  const lineDiscounts = round2(subtotal - afterLine);
  const net = round2(lines.reduce((s, l) => s + l.netAfterGlobal, 0));
  const globalDiscount = round2(afterLine - net);
  const rivalsa = round2(lines.reduce((s, l) => s + l.rivalsa, 0));
  const taxable = round2(net + rivalsa);

  const groupMap = new Map<number, VatGroup>();
  for (const l of lines) {
    const g = groupMap.get(l.vatRate) ?? { rate: l.vatRate, base: 0, vat: 0 };
    g.base += l.vatBase;
    g.vat += l.vat;
    groupMap.set(l.vatRate, g);
  }
  const vatGroups = [...groupMap.values()]
    .map((g) => ({ rate: g.rate, base: round2(g.base), vat: round2(g.vat) }))
    .sort((a, b) => b.rate - a.rate);
  const vatTotal = round2(vatGroups.reduce((s, g) => s + g.vat, 0));

  const exemptBase = vatGroups.filter((g) => g.rate === 0).reduce((s, g) => s + g.base, 0);
  const bollo = o.bollo && exemptBase > BOLLO_THRESHOLD ? BOLLO_AMOUNT : 0;

  const total = round2(taxable + vatTotal + bollo);
  const ritenuta = round2((rivalsaWithheld ? taxable : net) * (ritenutaPct / 100));
  const netPayable = round2(total - ritenuta);
  const deposit = round2(netPayable * (clampPct(o.depositPct) / 100));

  return {
    lines: lines.map((l) => ({
      ...l,
      netAfterGlobal: round2(l.netAfterGlobal),
      rivalsa: round2(l.rivalsa),
      vatBase: round2(l.vatBase),
      vat: round2(l.vat),
    })),
    subtotal,
    lineDiscounts,
    globalDiscount,
    net,
    rivalsa,
    taxable,
    vatGroups,
    vatTotal,
    bollo,
    total,
    ritenuta,
    netPayable,
    deposit,
  };
}

export function validUntil(quote: Quote): Date {
  const d = new Date(quote.date + "T00:00:00");
  d.setDate(d.getDate() + Math.max(0, Math.floor(safeNum(quote.validityDays))));
  return d;
}
