"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api, downloadBlob } from "@/lib/client-api";
import { useLocale } from "@/lib/i18n/context";
import { licenseStore, quotesStore } from "@/lib/storage";
import { Logo } from "./SiteChrome";
import { Button, Icon, Spinner } from "./ui";

type State =
  | { kind: "loading" }
  | { kind: "single"; docId: string; unlock: string; found: boolean }
  | { kind: "pro"; license: string }
  | { kind: "error" };

export function SuccessClient({ supportEmail }: { supportEmail: string }) {
  const { t } = useLocale();
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session_id") ?? "";
  const [state, setState] = useState<State>(() => (sessionId ? { kind: "loading" } : { kind: "error" }));
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const ran = useRef(false);

  const download = async (docId: string, unlock: string) => {
    const entry = quotesStore.get(docId);
    if (!entry) return;
    setDownloading(true);
    try {
      const r = await api.pdf(entry.quote, { unlock });
      downloadBlob(r.blob, r.filename);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (ran.current || !sessionId) return;
    ran.current = true;
    api
      .verify(sessionId)
      .then(async (v) => {
        if (v.kind === "single") {
          const entry = quotesStore.setUnlock(v.docId, v.unlock);
          setState({ kind: "single", docId: v.docId, unlock: v.unlock, found: Boolean(entry) });
          if (entry) await download(v.docId, v.unlock).catch(() => undefined);
        } else {
          licenseStore.save({ token: v.license, exp: v.exp, plan: v.plan, email: v.email });
          setState({ kind: "pro", license: v.license });
        }
      })
      .catch(() => setState({ kind: "error" }));
  }, [sessionId]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <Logo className="mb-8" />
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {state.kind === "loading" ? (
          <div className="flex items-center gap-3 text-slate-600">
            <Spinner className="h-5 w-5" /> {t("s.verifying")}
          </div>
        ) : null}

        {state.kind === "single" ? (
          <>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Icon name="check" className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{t("s.singleTitle")}</h1>
            <p className="mt-2 text-slate-600">{state.found ? t("s.singleText") : t("s.singleMissing")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {state.found ? (
                <Button onClick={() => download(state.docId, state.unlock)} loading={downloading}>
                  <Icon name="download" className="h-4 w-4" /> {t("s.singleDownload")}
                </Button>
              ) : null}
              <Button variant="secondary" onClick={() => router.push(`/app?doc=${encodeURIComponent(state.docId)}`)}>
                {t("s.singleBack")}
              </Button>
            </div>
          </>
        ) : null}

        {state.kind === "pro" ? (
          <>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
              <Icon name="star" className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{t("s.proTitle")}</h1>
            <p className="mt-2 text-slate-600">{t("s.proText")}</p>
            <div className="mt-5">
              <div className="mb-1 text-xs font-medium text-slate-500">{t("s.proKey")}</div>
              <div className="flex items-start gap-2">
                <code className="block flex-1 break-all rounded-lg bg-slate-100 p-3 font-mono text-[11px] text-slate-800">{state.license}</code>
                <Button variant="secondary" size="sm" onClick={() => copy(state.license)}>
                  <Icon name="copy" className="h-4 w-4" /> {copied ? t("common.copied") : t("common.copy")}
                </Button>
              </div>
            </div>
            <Link href="/app" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">
              <Icon name="bolt" className="h-5 w-5" /> {t("s.proGo")}
            </Link>
          </>
        ) : null}

        {state.kind === "error" ? (
          <>
            <h1 className="text-2xl font-bold text-slate-900">{t("s.errorTitle")}</h1>
            <p className="mt-2 text-slate-600">{t("s.errorText", { email: supportEmail })}</p>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => window.location.reload()}>{t("s.retry")}</Button>
              <Link href="/app" className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800">
                {t("s.singleBack")}
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
