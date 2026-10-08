/**
 * Minimal key-value store used only for shared quotes (the "send to client" feature).
 *
 *  - Production: Upstash Redis over REST. Works out of the box with the Vercel
 *    Marketplace integration (UPSTASH_REDIS_REST_URL / _TOKEN) and with the
 *    legacy Vercel KV variables (KV_REST_API_URL / _TOKEN).
 *  - Development / tests: an in-memory map, enabled with SHARE_STORE=memory.
 *  - Nothing configured: sharing is simply hidden in the UI.
 */

export interface KV {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSec: number): Promise<void>;
  del(key: string): Promise<void>;
}

class UpstashKV implements KV {
  constructor(
    private url: string,
    private token: string,
  ) {}

  private async cmd<T>(...args: string[]): Promise<T> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`KV ${args[0]} failed: HTTP ${res.status}`);
    const body = (await res.json()) as { result?: T; error?: string };
    if (body.error) throw new Error(`KV ${args[0]} failed: ${body.error}`);
    return body.result as T;
  }

  get(key: string) {
    return this.cmd<string | null>("GET", key);
  }
  async set(key: string, value: string, ttlSec: number) {
    await this.cmd("SET", key, value, "EX", String(ttlSec));
  }
  async del(key: string) {
    await this.cmd("DEL", key);
  }
}

class MemoryKV implements KV {
  private map = new Map<string, { value: string; exp: number }>();
  async get(key: string) {
    const e = this.map.get(key);
    if (!e) return null;
    if (e.exp < Date.now()) {
      this.map.delete(key);
      return null;
    }
    return e.value;
  }
  async set(key: string, value: string, ttlSec: number) {
    this.map.set(key, { value, exp: Date.now() + ttlSec * 1000 });
  }
  async del(key: string) {
    this.map.delete(key);
  }
}

type G = typeof globalThis & { __plMemoryKV?: MemoryKV };

export function getKV(): KV | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) return new UpstashKV(url, token);
  if (process.env.SHARE_STORE === "memory") {
    const g = globalThis as G;
    g.__plMemoryKV ??= new MemoryKV();
    return g.__plMemoryKV;
  }
  return null;
}

export function sharingEnabled(): boolean {
  return getKV() !== null;
}
