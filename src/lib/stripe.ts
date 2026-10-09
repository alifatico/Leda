import { BRAND } from "@/lib/brand";
import Stripe from "stripe";
import { appUrl, getPricing, stripeEnv, type PlanId } from "./env";

let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = stripeEnv.secretKey();
  if (!key) return null;
  if (!cached) {
    cached = new Stripe(key, {
      appInfo: { name: `${BRAND}`, url: "https://github.com/alifatico/leda" },
      maxNetworkRetries: 2,
      timeout: 20_000,
    });
  }
  return cached;
}

export const PLAN_IDS: PlanId[] = ["single", "pro_monthly", "pro_yearly"];

export function isPlanId(x: unknown): x is PlanId {
  return typeof x === "string" && (PLAN_IDS as string[]).includes(x);
}

const productCopy = {
  it: {
    single: { name: "Preventivo PDF", description: "Download del preventivo in PDF senza filigrana" },
    pro_monthly: { name: `${BRAND} Pro`, description: "Preventivi PDF illimitati, abbonamento mensile" },
    pro_yearly: { name: `${BRAND} Pro (annuale)`, description: "Preventivi PDF illimitati per 12 mesi" },
  },
  en: {
    single: { name: "Quote PDF", description: "Download this quote as a PDF without watermark" },
    pro_monthly: { name: `${BRAND} Pro`, description: "Unlimited PDF quotes, monthly subscription" },
    pro_yearly: { name: `${BRAND} Pro (yearly)`, description: "Unlimited PDF quotes for 12 months" },
  },
} as const;

function lineItemFor(plan: PlanId, locale: "it" | "en"): Stripe.Checkout.SessionCreateParams.LineItem {
  const ids = stripeEnv.priceIds();
  const configured = plan === "single" ? ids.single : plan === "pro_monthly" ? ids.proMonthly : ids.proYearly;
  if (configured) return { price: configured, quantity: 1 };
  const pricing = getPricing();
  const copy = productCopy[locale][plan];
  const unit_amount = plan === "single" ? pricing.single : plan === "pro_monthly" ? pricing.proMonthly : pricing.proYearly;
  const price_data: Stripe.Checkout.SessionCreateParams.LineItem.PriceData = {
    currency: pricing.currency,
    unit_amount,
    product_data: { name: copy.name, description: copy.description },
  };
  if (plan !== "single") price_data.recurring = { interval: plan === "pro_monthly" ? "month" : "year" };
  return { price_data, quantity: 1 };
}

export async function createCheckoutSession(args: {
  plan: PlanId;
  docId?: string;
  locale: "it" | "en";
}): Promise<{ url: string; id: string }> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");
  const base = appUrl();
  const isSub = args.plan !== "single";
  const docParam = args.docId ? `&doc=${encodeURIComponent(args.docId)}` : "";
  // NB: the {CHECKOUT_SESSION_ID} placeholder must stay un-encoded.
  const success_url = `${base}/success?session_id={CHECKOUT_SESSION_ID}&plan=${args.plan}${docParam}`;
  const cancel_url = `${base}/app?checkout=canceled${docParam}`;
  const metadata: Record<string, string> = { plan: args.plan, app: "preventivo-lampo" };
  if (args.docId) metadata.docId = args.docId;

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: isSub ? "subscription" : "payment",
    line_items: [lineItemFor(args.plan, args.locale)],
    success_url,
    cancel_url,
    locale: args.locale,
    metadata,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  };
  if (stripeEnv.collectTaxId()) {
    params.tax_id_collection = { enabled: true };
    if (!isSub) params.customer_creation = "always";
  }
  if (stripeEnv.automaticTax()) params.automatic_tax = { enabled: true };
  if (isSub) {
    params.subscription_data = { metadata };
  } else {
    params.invoice_creation = { enabled: true };
  }
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(params);
  } catch (err) {
    // Never lose a sale over an optional nicety: if Stripe rejects the tax-id /
    // invoice options (account settings vary), retry with the plain checkout.
    const optional = Boolean(params.tax_id_collection || params.invoice_creation || params.automatic_tax);
    if (!(err instanceof Stripe.errors.StripeInvalidRequestError) || !optional) throw err;
    console.warn("[checkout] retrying without optional options:", err.message);
    delete params.tax_id_collection;
    delete params.customer_creation;
    delete params.invoice_creation;
    delete params.automatic_tax;
    session = await stripe.checkout.sessions.create(params);
  }
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { url: session.url, id: session.id };
}

export type VerifiedSession =
  | { paid: true; kind: "single"; docId: string; sessionId: string; email?: string }
  | { paid: true; kind: "pro"; sub: string; cus: string; email?: string; plan: "monthly" | "yearly"; periodEndSec: number }
  | { paid: false; status: string };

function periodEndOf(sub: Stripe.Subscription): number {
  const item = sub.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined;
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end;
  const v = item?.current_period_end ?? legacy;
  return typeof v === "number" ? v : Math.floor(Date.now() / 1000);
}

function planOf(sub: Stripe.Subscription): "monthly" | "yearly" {
  const interval = sub.items?.data?.[0]?.price?.recurring?.interval;
  return interval === "year" ? "yearly" : "monthly";
}

export async function verifyCheckoutSession(sessionId: string): Promise<VerifiedSession> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
  const email = session.customer_details?.email ?? session.customer_email ?? undefined;
  if (session.mode === "subscription") {
    const sub = session.subscription;
    if (!sub || typeof sub === "string") return { paid: false, status: "no_subscription" };
    if (!["active", "trialing", "past_due"].includes(sub.status)) return { paid: false, status: sub.status };
    const cus = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    return { paid: true, kind: "pro", sub: sub.id, cus, email, plan: planOf(sub), periodEndSec: periodEndOf(sub) };
  }
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return { paid: false, status: session.payment_status };
  }
  const docId = session.metadata?.docId;
  if (!docId) return { paid: false, status: "missing_doc" };
  return { paid: true, kind: "single", docId, sessionId: session.id, email };
}

export type SubscriptionState =
  | { active: true; plan: "monthly" | "yearly"; periodEndSec: number; cus: string; email?: string }
  | { active: false; status: string };

export async function subscriptionState(subId: string): Promise<SubscriptionState> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");
  const sub = await stripe.subscriptions.retrieve(subId, { expand: ["customer"] });
  const cus = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const customer = typeof sub.customer === "string" ? null : (sub.customer as Stripe.Customer);
  const email = customer && !("deleted" in customer && customer.deleted) ? customer.email ?? undefined : undefined;
  if (sub.status === "active" || sub.status === "trialing") {
    return { active: true, plan: planOf(sub), periodEndSec: periodEndOf(sub), cus, email };
  }
  if (sub.status === "past_due") {
    // Short grace while Stripe retries the payment
    return { active: true, plan: planOf(sub), periodEndSec: Math.floor(Date.now() / 1000), cus, email };
  }
  return { active: false, status: sub.status };
}

/** Find an active Pro subscription for an e-mail address (used for licence recovery). */
export async function findActiveSubscriptionByEmail(
  email: string,
): Promise<{ sub: string; cus: string; plan: "monthly" | "yearly"; periodEndSec: number } | null> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");
  const customers = await stripe.customers.list({ email, limit: 10 });
  for (const c of customers.data) {
    const subs = await stripe.subscriptions.list({ customer: c.id, status: "active", limit: 5 });
    const sub = subs.data.find((s) => s.metadata?.app === "preventivo-lampo") ?? subs.data[0];
    if (sub) return { sub: sub.id, cus: c.id, plan: planOf(sub), periodEndSec: periodEndOf(sub) };
  }
  return null;
}

export async function createPortalSession(customerId: string): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");
  const configuration = stripeEnv.portalConfiguration();
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl()}/app`,
    ...(configuration ? { configuration } : {}),
  });
  return portal.url;
}

export function stripeErrorMessage(err: unknown): string {
  if (err instanceof Stripe.errors.StripeError) return `Stripe: ${err.message}`;
  if (err instanceof Error) return err.message;
  return "Unknown error";
}
