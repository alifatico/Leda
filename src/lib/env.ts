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

export const emailEnv = {
  resendApiKey: () => first(process.env.RESEND_API_KEY),
  from: () => first(process.env.EMAIL_FROM) ?? "Preventivo Lampo <onboarding@resend.dev>",
};

export const businessEnv = {
  name: () => first(process.env.BUSINESS_NAME) ?? "Preventivo Lampo",
  legalName: () => first(process.env.BUSINESS_LEGAL_NAME) ?? first(process.env.BUSINESS_NAME) ?? "[Ragione sociale]",
  address: () => first(process.env.BUSINESS_ADDRESS) ?? "[Indirizzo]",
  vat: () => first(process.env.BUSINESS_VAT) ?? "[Partita IVA]",
  supportEmail: () => first(process.env.SUPPORT_EMAIL) ?? "support@example.com",
};

export const analyticsEnv = {
  plausibleDomain: () => first(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN),
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
    pricing: getPricing(),
    supportEmail: businessEnv.supportEmail(),
    recovery: Boolean(emailEnv.resendApiKey()),
  };
}
