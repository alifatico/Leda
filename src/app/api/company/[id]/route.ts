import { NextResponse } from "next/server";
import { getCompany, lookupEnabled } from "@/lib/company";
import { jsonError } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { lookupErrorResponse } from "../errors";

/** Full card of one company: GET /api/company/:id (openapi id or VAT number) */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!lookupEnabled()) return jsonError("Company lookup is not enabled", 503, { code: "lookup_disabled" });
  const { id } = await ctx.params;
  if (!/^[A-Za-z0-9-]{1,64}$/.test(id)) return jsonError("Invalid company id", 400, { code: "bad_id" });
  const perIp = rateLimit(`company-get:${clientIp(req)}`, 30, 60 * 1000);
  if (!perIp.ok) return jsonError("Too many requests", 429, { code: "rate_limited", retryAfter: perIp.retryAfterSec });
  const r = await getCompany(id);
  if (!r.ok) return lookupErrorResponse("company/get", r.reason, r.message);
  if (!r.data) return jsonError("Company not found", 404, { code: "not_found" });
  return NextResponse.json({ party: r.data }, { headers: { "Cache-Control": "private, max-age=3600" } });
}
