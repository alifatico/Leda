import type { LookupFailure } from "@/lib/company";
import { jsonError } from "@/lib/http";

/** Map an upstream failure to what the browser needs to know (never the provider's message). */
export function lookupErrorResponse(where: string, reason: LookupFailure, message?: string) {
  if (reason !== "disabled") console.error(`[${where}]`, reason, message ?? "");
  const status = reason === "rate_limited" || reason === "quota" ? 429 : 503;
  return jsonError("Company lookup unavailable", status, { code: `lookup_${reason}` });
}
