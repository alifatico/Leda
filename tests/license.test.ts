import { describe, expect, it } from "vitest";
import {
  entitles,
  makeProLicense,
  makeSingleUnlock,
  signEntitlement,
  verifyEntitlement,
  DAY,
} from "@/lib/license";
import { rateLimit } from "@/lib/ratelimit";

const SECRET = "test-secret";

describe("entitlement tokens", () => {
  it("round-trips a single unlock and binds it to the document", () => {
    const token = signEntitlement(makeSingleUnlock("doc-1", "cs_test_1", 1000), SECRET);
    const r = verifyEntitlement(token, 1000 * 1000 + 5, SECRET);
    expect(r.ok).toBe(true);
    expect(entitles(r, "doc-1")).toBe(true);
    expect(entitles(r, "doc-2")).toBe(false);
  });

  it("rejects tampered tokens and wrong secrets", () => {
    const token = signEntitlement(makeSingleUnlock("doc-1", "cs_1", 1000), SECRET);
    const [body, sig] = token.split(".");
    const tamperedBody = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), doc: "doc-2" })).toString("base64url");
    expect(verifyEntitlement(`${tamperedBody}.${sig}`, 1000 * 1000, SECRET).ok).toBe(false);
    expect(verifyEntitlement(token, 1000 * 1000, "other").ok).toBe(false);
    expect(verifyEntitlement("garbage", 1000 * 1000, SECRET)).toEqual({ ok: false, reason: "malformed" });
    expect(verifyEntitlement(token, 1000 * 1000, "")).toEqual({ ok: false, reason: "unconfigured" });
  });

  it("expires", () => {
    const token = signEntitlement(makeSingleUnlock("doc-1", "cs_1", 1000), SECRET);
    const r = verifyEntitlement(token, (1000 + 366 * DAY) * 1000, SECRET);
    expect(r).toEqual({ ok: false, reason: "expired" });
  });

  it("pro licences unlock any document and are capped to the plan length", () => {
    const now = 1_700_000_000;
    const lic = makeProLicense({ sub: "sub_1", cus: "cus_1", plan: "monthly", periodEndSec: now + 400 * DAY }, now);
    expect(lic.exp).toBe(now + 35 * DAY);
    const token = signEntitlement(lic, SECRET);
    expect(entitles(verifyEntitlement(token, now * 1000, SECRET), "anything")).toBe(true);
    const short = makeProLicense({ sub: "sub_1", cus: "cus_1", plan: "monthly", periodEndSec: now - 10 * DAY }, now);
    expect(short.exp).toBe(now + DAY);
  });
});

describe("rateLimit", () => {
  it("allows up to max hits per window then blocks", () => {
    const key = `k-${Math.random()}`;
    expect(rateLimit(key, 2, 1000, 0).ok).toBe(true);
    expect(rateLimit(key, 2, 1000, 10).ok).toBe(true);
    const blocked = rateLimit(key, 2, 1000, 20);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBe(1);
    expect(rateLimit(key, 2, 1000, 1500).ok).toBe(true);
  });
});
