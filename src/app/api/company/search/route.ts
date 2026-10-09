import { NextResponse } from "next/server";
import { lookupEnabled, normalizeQuery, searchCompanies } from "@/lib/company";
import { jsonError } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { lookupErrorResponse } from "../errors";

/** Companies matching a name (or a VAT number): GET /api/company/search?q=… */
export async function GET(req: Request) {
  if (!lookupEnabled()) return jsonError("Company lookup is not enabled", 503, { code: "lookup_disabled" });
  const q = normalizeQuery(new URL(req.url).searchParams.get("q") ?? "");
  if (q.length < 3) return jsonError("Type at least 3 characters", 400, { code: "bad_query" });
  const perIp = rateLimit(`company:${clientIp(req)}`, 40, 60 * 1000);
  if (!perIp.ok) return jsonError("Too many requests", 429, { code: "rate_limited", retryAfter: perIp.retryAfterSec });
  const r = await searchCompanies(q);
  if (!r.ok) return lookupErrorResponse("company/search", r.reason, r.message);
  return NextResponse.json({ hits: r.data }, { headers: { "Cache-Control": "private, max-age=300" } });
}
