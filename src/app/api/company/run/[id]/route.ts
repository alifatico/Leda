import { NextResponse } from "next/server";
import { lookupEnabled, normalizeQuery, pollRun } from "@/lib/company";
import { jsonError } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { lookupErrorResponse } from "../../errors";

/** Progress of a register search run: GET /api/company/run/:id?q=… → `{ running: true }` or `{ hits }` */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!lookupEnabled()) return jsonError("Company lookup is not enabled", 503, { code: "lookup_disabled" });
  const { id } = await ctx.params;
  if (!/^[A-Za-z0-9_%.-]{1,120}$/.test(id)) return jsonError("Invalid run id", 400, { code: "bad_id" });
  const q = normalizeQuery(new URL(req.url).searchParams.get("q") ?? "");
  const perIp = rateLimit(`company-run:${clientIp(req)}`, 120, 60 * 1000);
  if (!perIp.ok) return jsonError("Too many requests", 429, { code: "rate_limited", retryAfter: perIp.retryAfterSec });
  const r = await pollRun(id, q);
  if (!r.ok) return lookupErrorResponse("company/run", r.reason, r.message);
  return NextResponse.json(r.data, { headers: { "Cache-Control": "no-store" } });
}
