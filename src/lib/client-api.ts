/* Browser-side helpers for the API routes. */
import type { PublicConfig, PlanId } from "./env";
import type { LineItem, Quote } from "./quote";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try {
      body = (await res.json()) as Record<string, unknown>;
    } catch {
      /* ignore */
    }
    throw new ApiError(String(body.error ?? res.statusText), res.status, String(body.code ?? "error"), body);
  }
  return (await res.json()) as T;
}

export const api = {
  config: () => call<PublicConfig>("/api/config"),

  checkout: (plan: PlanId, docId: string | undefined, locale: "it" | "en") =>
    call<{ url: string }>("/api/checkout", { method: "POST", body: JSON.stringify({ plan, docId, locale }) }),

  verify: (sessionId: string) =>
    call<
      | { kind: "single"; docId: string; unlock: string; email: string | null }
      | { kind: "pro"; license: string; email: string | null; plan: "monthly" | "yearly"; exp: number }
    >(`/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`),

  refreshLicense: (license: string) =>
    call<{ license: string; exp: number; plan: "monthly" | "yearly" }>("/api/license/refresh", {
      method: "POST",
      body: JSON.stringify({ license }),
    }),

  recoverLicense: (email: string, locale: "it" | "en") =>
    call<{ ok: true }>("/api/license/recover", { method: "POST", body: JSON.stringify({ email, locale }) }),

  portal: (license: string) => call<{ url: string }>("/api/portal", { method: "POST", body: JSON.stringify({ license }) }),

  aiDraft: (args: { brief: string; lang: "it" | "en"; currency: string; forfettario: boolean }) =>
    call<{ subject: string; notes: string; paymentTerms: string; items: LineItem[] }>("/api/ai/draft", {
      method: "POST",
      body: JSON.stringify(args),
    }),

  /** Returns the PDF bytes; throws ApiError on 402 so the caller can react (expired licence, etc.). */
  async pdf(quote: Quote, auth: { license?: string; unlock?: string }): Promise<{ blob: Blob; watermark: boolean; filename: string }> {
    const res = await fetch("/api/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote, ...auth }),
    });
    if (!res.ok) {
      let body: Record<string, unknown> = {};
      try {
        body = (await res.json()) as Record<string, unknown>;
      } catch {
        /* ignore */
      }
      throw new ApiError(String(body.error ?? res.statusText), res.status, String(body.code ?? "error"), body);
    }
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") ?? "";
    const m = /filename="([^"]+)"/.exec(cd);
    return { blob, watermark: res.headers.get("X-Watermark") === "1", filename: m?.[1] ?? "preventivo.pdf" };
  },
};

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function formatPrice(cents: number, currency: string, locale: "it" | "en"): string {
  return new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
