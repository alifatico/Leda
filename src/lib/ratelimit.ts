/**
 * Tiny in-memory sliding-window rate limiter. Good enough for a single
 * instance or a serverless function warm pool; swap for Upstash/Redis if you
 * ever need cross-instance accuracy.
 */

type Bucket = { hits: number[] };

const store: Map<string, Bucket> =
  (globalThis as unknown as { __plRateLimit?: Map<string, Bucket> }).__plRateLimit ?? new Map();
(globalThis as unknown as { __plRateLimit?: Map<string, Bucket> }).__plRateLimit = store;

let lastSweep = Date.now();

export function rateLimit(key: string, max: number, windowMs: number, now = Date.now()) {
  if (now - lastSweep > windowMs) {
    for (const [k, b] of store) {
      b.hits = b.hits.filter((t) => now - t < windowMs);
      if (b.hits.length === 0) store.delete(k);
    }
    lastSweep = now;
  }
  const bucket = store.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= max) {
    const oldest = bucket.hits[0];
    store.set(key, bucket);
    return { ok: false as const, remaining: 0, retryAfterSec: Math.ceil((oldest + windowMs - now) / 1000) };
  }
  bucket.hits.push(now);
  store.set(key, bucket);
  return { ok: true as const, remaining: max - bucket.hits.length, retryAfterSec: 0 };
}

export function clientIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? "unknown";
}
