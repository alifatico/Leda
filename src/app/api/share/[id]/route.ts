import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { ownerView, revoke, ShareError } from "@/lib/share";
import { sharingEnabled } from "@/lib/store";

/** Owner status: GET /api/share/:id?key=ownerKey */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!sharingEnabled()) return jsonError("Sharing is not configured", 503, { code: "sharing_disabled" });
  const rl = rateLimit(`share-status:${clientIp(req)}`, 240, 60 * 60 * 1000);
  if (!rl.ok) return jsonError("Too many requests", 429, { code: "rate_limited", retryAfter: rl.retryAfterSec });
  const { id } = await ctx.params;
  const ownerKey = new URL(req.url).searchParams.get("key") ?? "";
  try {
    const view = await ownerView(id, ownerKey);
    return NextResponse.json(view, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof ShareError) return jsonError(err.message, err.code === "not_found" ? 404 : err.code === "forbidden" ? 403 : 503, { code: err.code });
    console.error("[share/status]", err);
    return jsonError("Store error", 502, { code: "store_error" });
  }
}

/** Revoke the link: DELETE /api/share/:id with {ownerKey} */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!sharingEnabled()) return jsonError("Sharing is not configured", 503, { code: "sharing_disabled" });
  const { id } = await ctx.params;
  const body = await readJson<{ ownerKey?: string }>(req, 5_000);
  if (!body?.ownerKey) return jsonError("ownerKey is required", 400, { code: "bad_request" });
  try {
    await revoke(id, body.ownerKey);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ShareError) return jsonError(err.message, err.code === "forbidden" ? 403 : 503, { code: err.code });
    console.error("[share/revoke]", err);
    return jsonError("Store error", 502, { code: "store_error" });
  }
}
