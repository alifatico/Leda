/** "IT 01234567890" → "01234567890"; null when it is not an Italian VAT number. Safe for the browser. */
export function vatDigits(input: string): string | null {
  const s = input.replace(/[\s.-]/g, "").toUpperCase().replace(/^IT/, "");
  return /^\d{11}$/.test(s) ? s : null;
}
