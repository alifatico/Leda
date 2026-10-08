"use client";

import { useCallback, useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { api, ApiError } from "@/lib/client-api";
import { useLocale } from "@/lib/i18n/context";
import type { Quote } from "@/lib/quote";
import type { ShareOwnerView } from "@/lib/share";
import type { ShareInfo } from "@/lib/storage";
import { Badge, Button, Icon, Modal, Spinner } from "../ui";

type Auth = { license?: string; unlock?: string };

export function ShareModal({
  open,
  onClose,
  quote,
  auth,
  share,
  onShareChange,
  notify,
}: {
  open: boolean;
  onClose: () => void;
  quote: Quote;
  auth: Auth;
  share: ShareInfo | undefined;
  onShareChange: (s: ShareInfo | undefined) => void;
  notify: (msg: string, tone?: "info" | "error" | "success") => void;
}) {
  const { t, locale } = useLocale();
  const [busy, setBusy] = useState<"create" | "update" | "revoke" | null>(null);
  const [view, setView] = useState<ShareOwnerView | null>(null);
  const [copied, setCopied] = useState(false);
  const fmt = (ms: number) => new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(ms));

  const toInfo = (r: { id: string; ownerKey: string; url: string; status: ShareOwnerView }): ShareInfo => ({
    id: r.id,
    ownerKey: r.ownerKey,
    url: r.url,
    status: r.status.status,
    decisionName: r.status.decisionName,
    updatedAt: r.status.updatedAt,
  });

  const create = useCallback(
    async (existing?: { id: string; ownerKey: string }) => {
      setBusy(existing ? "update" : "create");
      try {
        const r = await api.share.create(quote, auth, existing);
        track(existing ? "share_update" : "share_create");
        onShareChange(toInfo(r));
        setView(r.status);
        if (existing) notify(t("b.share.updated"), "success");
      } catch (e) {
        if (e instanceof ApiError && e.code === "sharing_disabled") notify(t("b.share.disabled"), "error");
        else if (e instanceof ApiError && e.code === "payment_required") notify(t("b.share.requiresPaid"), "error");
        else if (e instanceof ApiError && e.code === "rate_limited") notify(t("common.rateLimited"), "error");
        else notify(t("common.error"), "error");
        if (!existing) onClose();
      } finally {
        setBusy(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quote, auth, onShareChange, notify, t],
  );

  // On open: create the link if missing, otherwise refresh its status (and keep polling while open).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const refresh = async () => {
      if (!share) return;
      try {
        const v = await api.share.status(share.id, share.ownerKey);
        if (cancelled) return;
        setView(v);
        if (v.status !== share.status || v.decisionName !== share.decisionName) {
          onShareChange({ ...share, status: v.status, decisionName: v.decisionName, updatedAt: v.updatedAt });
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 404 && !cancelled) onShareChange(undefined);
      }
    };
    // Deferred so the effect itself never sets state synchronously.
    queueMicrotask(() => {
      if (cancelled) return;
      if (!share) void create();
      else {
        void refresh();
        timer = setInterval(refresh, 15_000);
      }
    });
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, share?.id]);

  const copy = async () => {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const revoke = async () => {
    if (!share) return;
    setBusy("revoke");
    try {
      await api.share.revoke(share.id, share.ownerKey);
      onShareChange(undefined);
      setView(null);
      notify(t("b.share.revoked"));
      onClose();
    } catch {
      notify(t("common.error"), "error");
    } finally {
      setBusy(null);
    }
  };

  const status = view?.status ?? share?.status ?? "sent";
  const tone = status === "accepted" ? "green" : status === "declined" ? "amber" : status === "viewed" ? "indigo" : "slate";
  const outdated = Boolean(share && quote.updatedAt > share.updatedAt + 1000);
  const vars = { number: quote.number, sender: quote.sender.name || "", client: quote.client.name || "", url: share?.url ?? "" };
  const mailto = share ? `mailto:${encodeURIComponent(quote.client.email ?? "")}?subject=${encodeURIComponent(t("b.share.emailSubject", vars))}&body=${encodeURIComponent(t("b.share.emailBody", vars))}` : "#";
  const wa = share ? `https://wa.me/?text=${encodeURIComponent(t("b.share.whatsappText", vars))}` : "#";

  return (
    <Modal open={open} onClose={onClose} title={t("b.share.title")}>
      <p className="mb-4 text-sm text-slate-600">{t("b.share.subtitle")}</p>
      {!share ? (
        <div className="flex items-center gap-3 text-slate-600">
          <Spinner className="h-5 w-5" /> {t("b.share.creating")}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-500">{t("b.share.link")}</div>
            <div className="flex items-start gap-2">
              <code className="block flex-1 break-all rounded-lg bg-slate-100 p-3 text-xs text-slate-800">{share.url}</code>
              <Button variant="secondary" size="sm" onClick={copy}>
                <Icon name="copy" className="h-4 w-4" /> {copied ? t("b.share.copied") : t("b.share.copy")}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={wa} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              <Icon name="external" className="h-4 w-4" /> {t("b.share.whatsapp")}
            </a>
            <a href={mailto} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
              <Icon name="mail" className="h-4 w-4" /> {t("b.share.email")}
            </a>
          </div>

          <div className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <Badge tone={tone}>{t(`b.share.status.${status}`)}</Badge>
              {view ? <span className="text-xs text-slate-400">{t("p.revision", { n: view.revision })}</span> : null}
            </div>
            {view?.status === "viewed" && view.viewedAt ? <p className="mt-1 text-xs text-slate-500">{t("b.share.viewedAt", { date: fmt(view.viewedAt) })}</p> : null}
            {(view?.status === "accepted" || view?.status === "declined") && view.decidedAt ? (
              <p className="mt-1 text-xs text-slate-500">{t("b.share.decidedBy", { name: view.decisionName ?? "", date: fmt(view.decidedAt) })}</p>
            ) : null}
            {view?.decisionNote ? (
              <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-700">
                <span className="font-medium">{t("b.share.note")}:</span> {view.decisionNote}
              </p>
            ) : null}
          </div>

          {outdated ? <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">{t("b.share.outdated")}</p> : null}
          <p className="text-xs text-slate-500">{quote.sender.email ? t("b.share.notify", { email: quote.sender.email }) : t("b.share.notifyNoEmail")}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => create({ id: share.id, ownerKey: share.ownerKey })} loading={busy === "update"}>
              {t("b.share.update")}
            </Button>
            <Button variant="danger" size="sm" onClick={revoke} loading={busy === "revoke"}>
              {t("b.share.revoke")}
            </Button>
          </div>
          <p className="text-xs text-slate-400">{t("b.share.expires")}</p>
        </div>
      )}
    </Modal>
  );
}
