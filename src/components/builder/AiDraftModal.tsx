"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/client-api";
import { useLocale } from "@/lib/i18n/context";
import { formatMoney, type LineItem, type Quote } from "@/lib/quote";
import { Button, Icon, Modal, Textarea } from "../ui";

type Draft = { subject: string; notes: string; paymentTerms: string; items: LineItem[] };

export function AiDraftModal({
  open,
  onClose,
  quote,
  enabled,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  quote: Quote;
  enabled: boolean;
  onApply: (draft: Draft, mode: "replace" | "append") => void;
}) {
  const { t } = useLocale();
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const generate = async () => {
    setError(null);
    if (brief.trim().length < 10) {
      setError(t("b.ai.tooShort"));
      return;
    }
    setBusy(true);
    try {
      const d = await api.aiDraft({ brief: brief.trim(), lang: quote.lang, currency: quote.currency, forfettario: quote.options.regimeForfettario });
      setDraft(d);
    } catch (e) {
      if (e instanceof ApiError && e.code === "ai_disabled") setError(t("b.ai.disabled"));
      else if (e instanceof ApiError && (e.code === "rate_limited" || e.code === "quota")) setError(t("common.rateLimited"));
      else setError(t("b.ai.error"));
    } finally {
      setBusy(false);
    }
  };

  const apply = (mode: "replace" | "append") => {
    if (!draft) return;
    onApply(draft, mode);
    setDraft(null);
    setBrief("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t("b.ai.title")} wide>
      {!enabled ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t("b.ai.disabled")}</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-600">{t("b.ai.hint")}</p>
          <Textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder={t("b.ai.placeholder")} rows={4} maxLength={1500} disabled={busy} />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">{brief.length}/1500</span>
            <Button onClick={generate} loading={busy} disabled={busy}>
              <Icon name="sparkles" className="h-4 w-4" /> {busy ? t("b.ai.generating") : t("b.ai.generate")}
            </Button>
          </div>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          {draft ? (
            <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-900">
                <Icon name="check" className="h-4 w-4" /> {t("b.ai.result")}: {draft.subject}
              </div>
              <ul className="divide-y divide-indigo-100 text-sm">
                {draft.items.map((it) => (
                  <li key={it.id} className="flex items-start justify-between gap-3 py-1.5">
                    <span>
                      <span className="font-medium text-slate-800">{it.description}</span>
                      {it.details ? <span className="block text-xs text-slate-500">{it.details}</span> : null}
                    </span>
                    <span className="whitespace-nowrap text-slate-700">
                      {it.quantity} {it.unit} × {formatMoney(it.unitPrice, quote.currency, quote.lang)}
                    </span>
                  </li>
                ))}
              </ul>
              {draft.notes ? <p className="mt-2 text-xs text-slate-600">{draft.notes}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => apply("replace")}>{t("b.ai.replace")}</Button>
                <Button variant="secondary" onClick={() => apply("append")}>
                  {t("b.ai.append")}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </Modal>
  );
}
