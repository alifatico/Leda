import type { DocLang } from "./types";

const localeOf: Record<DocLang, string> = { it: "it-IT", en: "en-GB" };

export function formatMoney(amount: number, currency: string, lang: DocLang = "it"): string {
  try {
    return new Intl.NumberFormat(localeOf[lang], {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: "always",
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatNumber(n: number, lang: DocLang = "it", maxFraction = 2): string {
  return new Intl.NumberFormat(localeOf[lang], {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFraction,
    useGrouping: "always",
  }).format(n);
}

export function formatPct(n: number, lang: DocLang = "it"): string {
  return `${formatNumber(n, lang, 2)}%`;
}

export function formatDate(iso: string | Date, lang: DocLang = "it"): string {
  const d = typeof iso === "string" ? new Date(iso + (iso.length === 10 ? "T00:00:00" : "")) : iso;
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(localeOf[lang], {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Lines of a postal address, skipping the empty parts. */
export function addressLines(p: {
  address?: string;
  zip?: string;
  city?: string;
  province?: string;
  country?: string;
}): string[] {
  const out: string[] = [];
  if (p.address) out.push(p.address);
  const cityLine = [p.zip, p.city, p.province ? `(${p.province})` : ""].filter(Boolean).join(" ");
  if (cityLine) out.push(cityLine);
  if (p.country) out.push(p.country);
  return out;
}
