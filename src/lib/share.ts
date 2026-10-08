import { createHash, randomBytes } from "node:crypto";
import { appUrl } from "./env";
import type { Quote } from "./quote";
import { getKV, type KV } from "./store";

/**
 * "Send to client": a paid quote gets a public link where the client can read
 * it, download the clean PDF and accept or decline it. Everything is stored as
 * one JSON record with a TTL; the owner keeps a secret key in their browser.
 */

export type ShareStatus = "sent" | "viewed" | "accepted" | "declined";

export type ShareRecord = {
  id: string;
  ownerKey: string;
  quote: Quote;
  revision: number;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  status: ShareStatus;
  viewedAt?: number;
  decidedAt?: number;
  decisionName?: string;
  decisionNote?: string;
  decisionIpHash?: string;
  notifyEmail?: string;
};

/** What the client (and anyone with the link) can see. */
export type SharePublic = Omit<ShareRecord, "ownerKey" | "notifyEmail" | "decisionIpHash">;

/** What the owner sees in the app. */
export type ShareOwnerView = Omit<ShareRecord, "ownerKey" | "quote" | "decisionIpHash"> & { url: string };

export const SHARE_TTL_SEC = 365 * 24 * 3600;
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomId(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function hashIp(ip: string, day = new Date().toISOString().slice(0, 10)): string {
  return createHash("sha256").update(`${day}:${ip}`).digest("hex").slice(0, 16);
}

export function shareUrl(id: string): string {
  return `${appUrl()}/p/${id}`;
}

const key = (id: string) => `share:${id}`;

async function load(kv: KV, id: string): Promise<ShareRecord | null> {
  if (!/^[A-Za-z0-9]{8,32}$/.test(id)) return null;
  const raw = await kv.get(key(id));
  if (!raw) return null;
  try {
    const rec = JSON.parse(raw) as ShareRecord;
    if (rec.expiresAt < Date.now()) return null;
    return rec;
  } catch {
    return null;
  }
}

async function save(kv: KV, rec: ShareRecord): Promise<void> {
  const ttl = Math.max(60, Math.floor((rec.expiresAt - Date.now()) / 1000));
  await kv.set(key(rec.id), JSON.stringify(rec), ttl);
}

export function toPublic(rec: ShareRecord): SharePublic {
  const { ownerKey: _o, notifyEmail: _n, decisionIpHash: _h, ...rest } = rec;
  void _o;
  void _n;
  void _h;
  return rest;
}

export function toOwnerView(rec: ShareRecord): ShareOwnerView {
  const { ownerKey: _o, quote: _q, decisionIpHash: _h, ...rest } = rec;
  void _o;
  void _q;
  void _h;
  return { ...rest, url: shareUrl(rec.id) };
}

export class ShareError extends Error {
  constructor(
    public code: "disabled" | "not_found" | "forbidden" | "already_decided",
    message?: string,
  ) {
    super(message ?? code);
  }
}

function kvOrThrow(): KV {
  const kv = getKV();
  if (!kv) throw new ShareError("disabled", "Sharing is not configured");
  return kv;
}

export async function createOrUpdateShare(args: {
  quote: Quote;
  existing?: { id: string; ownerKey: string };
  notifyEmail?: string;
}): Promise<{ record: ShareRecord; url: string }> {
  const kv = kvOrThrow();
  const now = Date.now();
  if (args.existing) {
    const rec = await load(kv, args.existing.id);
    if (rec && rec.ownerKey === args.existing.ownerKey) {
      const changed = JSON.stringify(rec.quote) !== JSON.stringify(args.quote);
      const next: ShareRecord = {
        ...rec,
        quote: args.quote,
        notifyEmail: args.notifyEmail ?? rec.notifyEmail,
        updatedAt: now,
        expiresAt: now + SHARE_TTL_SEC * 1000,
        revision: changed ? rec.revision + 1 : rec.revision,
      };
      if (changed && (rec.status === "accepted" || rec.status === "declined")) {
        // The owner changed the document after a decision: the decision no longer applies.
        next.status = "sent";
        delete next.decidedAt;
        delete next.decisionName;
        delete next.decisionNote;
        delete next.decisionIpHash;
      }
      await save(kv, next);
      return { record: next, url: shareUrl(next.id) };
    }
  }
  const rec: ShareRecord = {
    id: randomId(12),
    ownerKey: randomId(24),
    quote: args.quote,
    revision: 1,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + SHARE_TTL_SEC * 1000,
    status: "sent",
    notifyEmail: args.notifyEmail,
  };
  await save(kv, rec);
  return { record: rec, url: shareUrl(rec.id) };
}

/** Request time, read outside React so prerender/purity rules stay happy (only used by dynamic pages). */
export function requestTime(): number {
  return Date.now();
}

export async function getShare(id: string): Promise<ShareRecord | null> {
  const kv = getKV();
  if (!kv) return null;
  return load(kv, id);
}

export async function markViewed(id: string): Promise<void> {
  const kv = kvOrThrow();
  const rec = await load(kv, id);
  if (!rec || rec.status !== "sent") return;
  rec.status = "viewed";
  rec.viewedAt = Date.now();
  await save(kv, rec);
}

export async function decide(
  id: string,
  args: { decision: "accepted" | "declined"; name: string; note?: string; ipHash: string },
): Promise<ShareRecord> {
  const kv = kvOrThrow();
  const rec = await load(kv, id);
  if (!rec) throw new ShareError("not_found");
  if (rec.status === "accepted" || rec.status === "declined") throw new ShareError("already_decided");
  rec.status = args.decision;
  rec.decidedAt = Date.now();
  rec.decisionName = args.name.trim().slice(0, 120);
  rec.decisionNote = args.note?.trim().slice(0, 1000) || undefined;
  rec.decisionIpHash = args.ipHash;
  rec.updatedAt = Date.now();
  await save(kv, rec);
  return rec;
}

export async function ownerView(id: string, ownerKey: string): Promise<ShareOwnerView> {
  const kv = kvOrThrow();
  const rec = await load(kv, id);
  if (!rec) throw new ShareError("not_found");
  if (rec.ownerKey !== ownerKey) throw new ShareError("forbidden");
  return toOwnerView(rec);
}

export async function revoke(id: string, ownerKey: string): Promise<void> {
  const kv = kvOrThrow();
  const rec = await load(kv, id);
  if (!rec) return;
  if (rec.ownerKey !== ownerKey) throw new ShareError("forbidden");
  await kv.del(key(id));
}
