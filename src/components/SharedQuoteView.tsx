"use client";

import { BRAND } from "@/lib/brand";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/client-api";
import { dicts, lookup, type TKey } from "@/lib/i18n/dict";
import { formatDate, validUntil } from "@/lib/quote";
import type { SharePublic } from "@/lib/share";
import { QuotePreview } from "./QuotePreview";
import { Button, Icon, Input, Textarea } from "./ui";

/** The page a client sees when they open a quote link. Labels follow the document language. */
export function SharedQuoteView({ data, now }: { data: SharePublic; now: number }) {
  const [rec, setRec] = useState<SharePublic>(data);
  const lang = rec.quote.lang;
  const t = (key: TKey, vars?: Record<string, string | number>) => lookup(dicts[lang], key, vars);
  const [mode, setMode] = useState<"idle" | "accept" | "decline">("idle");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewed = useRef(false);

  const sender = rec.quote.sender.name || "—";
  const expiry = validUntil(rec.quote);
  const expired = expiry.getTime() < now - 24 * 3600 * 1000;
  const decided = rec.status === "accepted" || rec.status === "declined";
  const fmt = (ms: number) => new Intl.DateTimeFormat(lang === "it" ? "it-IT" : "en-GB", { dateStyle: "long", timeStyle: "short" }).format(new Date(ms));

  useEffect(() => {
    if (viewed.current || rec.status !== "sent") return;
    viewed.current = true;
    api.share.view(rec.id).catch(() => undefined);
  }, [rec.id, rec.status]);

  const submit = async () => {
    if (mode === "idle") return;
    setError(null);
    if (name.trim().length < 2) {
      setError(t("p.yourName"));
      return;
    }
    setBusy(true);
    try {
      const updated = await api.share.decide(rec.id, { decision: mode === "accept" ? "accepted" : "declined", name: name.trim(), note: note.trim() || undefined });
      setRec(updated);
      setMode("idle");
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) window.location.reload();
      else setError(lookup(dicts[lang], "common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <div className="text-lg font-semibold text-slate-900">{t("p.title", { number: rec.quote.number })}</div>
            <div className="text-sm text-slate-500">
              {t("p.from", { sender })} · {t("p.expiresOn", { date: formatDate(expiry, lang) })}
            </div>
          </div>
          <a href={`/api/share/${encodeURIComponent(rec.id)}/pdf`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
            <Icon name="download" className="h-4 w-4" /> {t("p.download")}
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {decided ? (
          <div className={"mb-5 rounded-xl border p-4 " + (rec.status === "accepted" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900")}>
            <div className="flex items-center gap-2 font-semibold">
              <Icon name={rec.status === "accepted" ? "check" : "x"} className="h-5 w-5" />
              {t(rec.status === "accepted" ? "p.accepted" : "p.declined", { date: fmt(rec.decidedAt ?? now) })} {rec.decisionName ? t("p.by", { name: rec.decisionName }) : ""}
            </div>
            <p className="mt-1 text-sm">{t("p.thanks", { sender })}</p>
          </div>
        ) : expired ? (
          <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 text-slate-700">{t("p.expired", { date: formatDate(expiry, lang), sender })}</div>
        ) : (
          <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
            {mode === "idle" ? (
              <div className="flex flex-wrap gap-2">
                <Button size="lg" onClick={() => setMode("accept")}>
                  <Icon name="check" className="h-5 w-5" /> {t("p.accept")}
                </Button>
                <Button size="lg" variant="secondary" onClick={() => setMode("decline")}>
                  {t("p.decline")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("p.yourName")} autoFocus maxLength={120} />
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("p.noteOptional", { sender })} rows={2} maxLength={1000} />
                <p className="text-xs text-slate-500">{t("p.legal")}</p>
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={submit} loading={busy} variant={mode === "accept" ? "primary" : "danger"}>
                    {mode === "accept" ? t("p.confirmAccept") : t("p.confirmDecline")}
                  </Button>
                  <Button variant="ghost" onClick={() => setMode("idle")} disabled={busy}>
                    {lookup(dicts[lang], "common.cancel")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
          <div className="overflow-x-auto">
            <QuotePreview quote={rec.quote} />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-center">
          <p className="font-semibold text-slate-900">{t("p.ctaTitle")}</p>
          <p className="mt-1 text-sm text-slate-600">{t("p.ctaText")}</p>
          <Link href="/?utm_source=share&utm_medium=cta" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
            <Icon name="bolt" className="h-4 w-4" /> {t("p.ctaButton")}
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          {t("p.poweredBy")}{" "}
          <Link href="/" className="font-medium text-slate-500 hover:text-slate-700">
            {BRAND}
          </Link>
        </p>
      </main>
    </div>
  );
}
