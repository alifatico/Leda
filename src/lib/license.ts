import { createHmac, timingSafeEqual } from "node:crypto";
import { licenseSecret } from "./env";

/**
 * Stateless entitlements. Stripe is the only source of truth; we never store
 * anything ourselves. After a verified Checkout we hand the browser a signed
 * token that the PDF endpoint can check offline.
 *
 *  - "single": unlocks one document id, long lived
 *  - "pro": unlocks everything until the end of the current billing period
 *           (plus a small grace); the client refreshes it transparently.
 */

export type SingleUnlock = {
  v: 1;
  kind: "single";
  /** document id */
  doc: string;
  /** checkout session id */
  sid: string;
  iat: number;
  exp: number;
};

export type ProLicense = {
  v: 1;
  kind: "pro";
  /** Stripe subscription id */
  sub: string;
  /** Stripe customer id */
  cus: string;
  email?: string;
  plan: "monthly" | "yearly";
  iat: number;
  exp: number;
};

export type Entitlement = SingleUnlock | ProLicense;

const b64u = {
  encode: (buf: Buffer | string) => Buffer.from(buf).toString("base64url"),
  decode: (s: string) => Buffer.from(s, "base64url"),
};

function hmac(data: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(data).digest();
}

export function signEntitlement(payload: Entitlement, secret = licenseSecret()): string {
  if (!secret) throw new Error("LICENSE_SECRET (or STRIPE_SECRET_KEY) is not configured");
  const body = b64u.encode(JSON.stringify(payload));
  const sig = b64u.encode(hmac(body, secret));
  return `${body}.${sig}`;
}

export type VerifyResult =
  | { ok: true; payload: Entitlement }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" | "unconfigured" };

export function verifyEntitlement(
  token: string | undefined | null,
  now = Date.now(),
  secret = licenseSecret(),
  opts: { ignoreExp?: boolean } = {},
): VerifyResult {
  if (!secret) return { ok: false, reason: "unconfigured" };
  if (!token || typeof token !== "string") return { ok: false, reason: "malformed" };
  const parts = token.trim().split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [body, sig] = parts;
  let expected: Buffer;
  let given: Buffer;
  try {
    expected = hmac(body, secret);
    given = b64u.decode(sig);
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: "bad_signature" };
  }
  let payload: Entitlement;
  try {
    payload = JSON.parse(b64u.decode(body).toString("utf8")) as Entitlement;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!payload || payload.v !== 1 || (payload.kind !== "single" && payload.kind !== "pro")) {
    return { ok: false, reason: "malformed" };
  }
  if (typeof payload.exp !== "number") return { ok: false, reason: "malformed" };
  if (!opts.ignoreExp && payload.exp * 1000 < now) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, payload };
}

export const DAY = 24 * 60 * 60;

export function makeSingleUnlock(doc: string, sid: string, nowSec = Math.floor(Date.now() / 1000)): SingleUnlock {
  return { v: 1, kind: "single", doc, sid, iat: nowSec, exp: nowSec + 365 * DAY };
}

export function makeProLicense(
  args: { sub: string; cus: string; email?: string; plan: "monthly" | "yearly"; periodEndSec: number },
  nowSec = Math.floor(Date.now() / 1000),
): ProLicense {
  const grace = 3 * DAY;
  // Never issue a token that lasts longer than the plan length + grace, even
  // if Stripe reports a far-away period end.
  const cap = nowSec + (args.plan === "yearly" ? 370 : 35) * DAY;
  const exp = Math.min(Math.max(args.periodEndSec + grace, nowSec + DAY), cap);
  return { v: 1, kind: "pro", sub: args.sub, cus: args.cus, email: args.email, plan: args.plan, iat: nowSec, exp };
}

/** Does this token unlock the given document? */
export function entitles(result: VerifyResult, docId: string): boolean {
  if (!result.ok) return false;
  const p = result.payload;
  if (p.kind === "pro") return true;
  return p.doc === docId;
}
