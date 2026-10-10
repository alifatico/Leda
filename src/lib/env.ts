import { BRAND } from "@/lib/brand";
import { createHash } from "node:crypto";

/**
 * Typed access to configuration. Only STRIPE_SECRET_KEY is required to start
 * selling; everything else has a sensible default or is optional.
 * This module is server-only.
 */

function first(...vals: (string | undefined)[]): string | undefined {
  for (const v of vals) if (v && v.trim()) return v.trim();
  return undefined;
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function appUrl(): string {
  const explicit = first(process.env.APP_URL, process.env.NEXT_PUBLIC_APP_URL);
  if (explicit) return explicit.replace(/\/$/, "");
  const vercelProd = first(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercelProd) return `https://${vercelProd}`;
  const vercel = first(process.env.VERCEL_URL);
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export const stripeEnv = {
  secretKey: () => first(process.env.STRIPE_SECRET_KEY),
  priceIds: () => ({
    single: first(process.env.STRIPE_PRICE_SINGLE),
    proMonthly: first(process.env.STRIPE_PRICE_PRO_MONTHLY),
    proYearly: first(process.env.STRIPE_PRICE_PRO_YEARLY),
  }),
  automaticTax: () => process.env.STRIPE_AUTOMATIC_TAX === "1" || process.env.STRIPE_AUTOMATIC_TAX === "true",
  /** Optional Customer Portal configuration id (bpc_…); otherwise Stripe uses the account default */
  portalConfiguration: () => first(process.env.STRIPE_PORTAL_CONFIGURATION),
  collectTaxId: () => process.env.STRIPE_COLLECT_TAX_ID !== "0" && process.env.STRIPE_COLLECT_TAX_ID !== "false",
};

export function paymentsEnabled(): boolean {
  return Boolean(stripeEnv.secretKey());
}

/** Signing secret for licence/unlock tokens. Derived from the Stripe key when not set explicitly. */
export function licenseSecret(): string | undefined {
  const explicit = first(process.env.LICENSE_SECRET);
  if (explicit) return explicit;
  const stripeKey = stripeEnv.secretKey();
  if (stripeKey) return createHash("sha256").update(`preventivo-lampo:license:${stripeKey}`).digest("hex");
  if (!isProduction()) return "dev-only-insecure-license-secret";
  return undefined;
}

export const aiEnv = {
  apiKey: () => first(process.env.ANTHROPIC_API_KEY),
  model: () => first(process.env.ANTHROPIC_MODEL) ?? "claude-opus-5-5",
  enabled: () => Boolean(first(process.env.ANTHROPIC_API_KEY)) && process.env.AI_DRAFT_DISABLED !== "1",
};

export type CompanyProvider = "openapi" | "apify" | "vies" | "mock";
/** autocomplete: results while typing (real-time API); on-demand: a "search" button, results after a run of some seconds */
/** autocomplete: names while typing; on-demand: a button per search; vat: VAT numbers only (VIES) */
export type CompanyLookupMode = "off" | "autocomplete" | "on-demand" | "vat";

/**
 * Client lookup in the Italian business register. Two providers: openapi.com
 * (company.openapi.com, real-time API, prepaid wallet) and an Apify actor that
 * scrapes the register (runs of tens of seconds, pay per result). Hidden without
 * a token; COMPANY_LOOKUP=mock serves canned companies for local development.
 */
export const companyEnv = {
  provider(): CompanyProvider | null {
    const chosen = process.env.COMPANY_LOOKUP;
    if (chosen === "off") return null;
    if (chosen === "mock") return "mock";
    if (chosen === "vies") return "vies";
    if (chosen === "apify") return first(process.env.APIFY_TOKEN) ? "apify" : null;
    if (chosen === "openapi") return first(process.env.OPENAPI_COMPANY_TOKEN) ? "openapi" : null;
    if (first(process.env.OPENAPI_COMPANY_TOKEN)) return "openapi";
    // Apify is never picked on its own: a run takes tens of seconds. The free EU
    // VAT register (VIES) answers in under a second and needs no token.
    return "vies";
  },
  mode(): CompanyLookupMode {
    const p = companyEnv.provider();
    if (!p) return "off";
    if (p === "vies") return "vat";
    const forced = process.env.COMPANY_LOOKUP_MODE;
    if (forced === "autocomplete" || forced === "on-demand") return forced;
    return p === "apify" ? "on-demand" : "autocomplete";
  },
  enabled: () => companyEnv.mode() !== "off",
  openapi: {
    token: () => first(process.env.OPENAPI_COMPANY_TOKEN),
    sandbox: () => process.env.OPENAPI_COMPANY_SANDBOX === "1" || process.env.OPENAPI_COMPANY_SANDBOX === "true",
  },
  apify: {
    token: () => first(process.env.APIFY_TOKEN),
    /** "username~actor-name" as the Apify API wants it */
    actor: () => first(process.env.APIFY_COMPANY_ACTOR) ?? "jungle_synthesizer~italy-registroimprese-bilanci-scraper",
    /** Results per search; each one is paid */
    maxItems: () => Math.min(intEnv("APIFY_COMPANY_MAX_ITEMS", 5), 20),
    /** Run timeout in seconds */
    timeoutSecs: () => Math.min(intEnv("APIFY_COMPANY_TIMEOUT", 120), 300),
  },
  /** Hard cap of paid upstream calls per day across all users (cost control) */
  dailyLimit: () => intEnv("COMPANY_LOOKUP_DAILY_LIMIT", companyEnv.provider() === "apify" ? 300 : 2000),
};

export const emailEnv = {
  resendApiKey: () => first(process.env.RESEND_API_KEY),
  from: () => first(process.env.EMAIL_FROM) ?? `${BRAND} <onboarding@resend.dev>`,
};

export const businessEnv = {
  name: () => first(process.env.BUSINESS_NAME) ?? `${BRAND}`,
  legalName: () => first(process.env.BUSINESS_LEGAL_NAME) ?? first(process.env.BUSINESS_NAME) ?? "[Ragione sociale]",
  address: () => first(process.env.BUSINESS_ADDRESS) ?? "[Indirizzo]",
  vat: () => first(process.env.BUSINESS_VAT) ?? "[Partita IVA]",
  supportEmail: () => first(process.env.SUPPORT_EMAIL) ?? "support@example.com",
};

export const analyticsEnv = {
  plausibleDomain: () => first(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN),
  /** Google Search Console HTML-tag verification token */
  googleSiteVerification: () => first(process.env.GOOGLE_SITE_VERIFICATION),
};

export type PlanId = "single" | "pro_monthly" | "pro_yearly";

export type Pricing = {
  currency: string;
  /** amounts in minor units (cents) */
  single: number;
  proMonthly: number;
  proYearly: number;
};

export function getPricing(): Pricing {
  return {
    currency: (first(process.env.PRICE_CURRENCY) ?? "eur").toLowerCase(),
    single: intEnv("PRICE_SINGLE_CENTS", 490),
    proMonthly: intEnv("PRICE_PRO_MONTHLY_CENTS", 900),
    proYearly: intEnv("PRICE_PRO_YEARLY_CENTS", 5900),
  };
}

/** What the browser is allowed to know about the configuration. */
export type PublicConfig = {
  payments: boolean;
  ai: boolean;
  /** "send to client" link + online acceptance (needs a KV store, see src/lib/store.ts) */
  sharing: boolean;
  /** client search in the business register (needs a provider token, see src/lib/company.ts) */
  companyLookup: CompanyLookupMode;
  pricing: Pricing;
  supportEmail: string;
  recovery: boolean;
};

export function sharingConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return Boolean(url && token) || process.env.SHARE_STORE === "memory";
}

export function publicConfig(): PublicConfig {
  return {
    payments: paymentsEnabled(),
    ai: aiEnv.enabled(),
    sharing: sharingConfigured(),
    companyLookup: companyEnv.mode(),
    pricing: getPricing(),
    supportEmail: businessEnv.supportEmail(),
    recovery: Boolean(emailEnv.resendApiKey()),
  };
}
