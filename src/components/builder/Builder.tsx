"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { api, ApiError, downloadBlob, formatPrice } from "@/lib/client-api";
import type { PlanId, PublicConfig } from "@/lib/env";
import { useLocale } from "@/lib/i18n/context";
import { applyPreset, hasPreset, type LineItem, newId, nextQuoteNumber, type Quote } from "@/lib/quote";
import { createQuoteFromProfile, createQuoteFromTemplate, profileStore, quotesStore, type ShareInfo, type StoredQuote } from "@/lib/storage";
import { LocaleSwitch } from "../LocaleSwitch";
import { QuotePreview } from "../QuotePreview";
import { Logo } from "../SiteChrome";
import { Badge, Button, Field, Icon, Textarea, Toast, cx, useToast } from "../ui";
import { AiDraftModal } from "./AiDraftModal";
import { BrandingForm } from "./BrandingForm";
import { ItemsEditor } from "./ItemsEditor";
import { DetailsForm, OptionsForm } from "./OptionsForm";
import { PartyForm } from "./PartyForm";
import { PaywallModal } from "./PaywallModal";
import { ProPanel } from "./ProPanel";
import { QuotesDrawer } from "./QuotesDrawer";
import { ShareModal } from "./ShareModal";
import { useLicense } from "./useLicense";

type SectionKey = "details" | "sender" | "client" | "items" | "options" | "notes" | "branding";

function Section({
  k,
  open,
  onToggle,
  title,
  children,
  right,
}: {
  k: SectionKey;
  open: boolean;
  onToggle: (k: SectionKey) => void;
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <button className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-slate-900" onClick={() => onToggle(k)}>
          <Icon name="chevron" className={cx("h-4 w-4 text-slate-400 transition-transform", open && "rotate-90")} />
          {title}
        </button>
        {right}
      </div>
      {open ? <div className="border-t border-slate-100 px-4 py-4">{children}</div> : null}
    </section>
  );
}

export default function Builder({ config: initialConfig }: { config: PublicConfig }) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, show } = useToast();
  const license = useLicense();

  const [config, setConfig] = useState(initialConfig);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [unlock, setUnlock] = useState<string | undefined>(undefined);
  const [share, setShare] = useState<ShareInfo | undefined>(undefined);
  const [shareOpen, setShareOpen] = useState(false);
  const [quotes, setQuotes] = useState<StoredQuote[]>([]);
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({ details: true, sender: true, client: true, items: true, options: false, notes: false, branding: false });
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [busy, setBusy] = useState<"free" | "paid" | null>(null);
  const [busyPlan, setBusyPlan] = useState<PlanId | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [proOpen, setProOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);

  // ---- bootstrap: storage, URL params, fresh config
  useEffect(() => {
    let cancelled = false;
    // localStorage is only readable after hydration; defer so the first paint stays identical to the server's.
    queueMicrotask(() => {
      if (cancelled) return;
      const all = quotesStore.all();
      setQuotes(all);
      const wanted = searchParams.get("doc");
      const template = searchParams.get("template");
      const preset = !template && hasPreset(searchParams);
      const found = !template && !preset && ((wanted && all.find((s) => s.quote.id === wanted)) || all[0]);
      if (template) {
        setQuote(createQuoteFromTemplate(template) ?? createQuoteFromProfile());
      } else if (preset) {
        setQuote(applyPreset(createQuoteFromProfile(), searchParams));
      } else if (found) {
        setQuote(found.quote);
        setUnlock(found.unlock);
        setShare(found.share);
      } else {
        setQuote(createQuoteFromProfile());
      }
      if (searchParams.get("ai")) setAiOpen(true);
      const lic = searchParams.get("license");
      if (lic) {
        const ok = license.activate(lic);
        show(ok ? t("b.pro.activated") : t("b.pro.invalidKey"), ok ? "success" : "error");
      }
      if (searchParams.get("checkout") === "canceled") show(t("b.canceled"));
      if (searchParams.get("plan")) setPaywall(true);
      if (lic || searchParams.get("checkout") || searchParams.get("plan") || template || preset || searchParams.get("ai")) router.replace("/app");
      api.config().then((c) => !cancelled && setConfig(c)).catch(() => undefined);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- autosave
  useEffect(() => {
    if (!quote) return;
    const id = setTimeout(() => {
      quotesStore.save({ quote, unlock, share });
      profileStore.updateFromQuote(quote);
      setQuotes(quotesStore.all());
    }, 350);
    return () => clearTimeout(id);
  }, [quote, unlock, share]);

  const update = useCallback((patch: Partial<Quote>) => {
    setQuote((q) => (q ? { ...q, ...patch, updatedAt: Date.now() } : q));
  }, []);

  const selectQuote = (id: string) => {
    const s = quotesStore.get(id);
    if (!s) return;
    setQuote(s.quote);
    setUnlock(s.unlock);
    setShare(s.share);
    setDrawer(false);
    setMobileTab("edit");
  };
  const createNew = () => {
    if (quote) quotesStore.save({ quote, unlock, share });
    setQuote(createQuoteFromProfile());
    setUnlock(undefined);
    setShare(undefined);
    setDrawer(false);
  };
  const duplicate = (id: string) => {
    const s = quotesStore.get(id);
    if (!s) return;
    const copy: Quote = { ...s.quote, id: newId(), number: nextQuoteNumber(quotesStore.numbers()), createdAt: Date.now(), updatedAt: Date.now() };
    quotesStore.save({ quote: copy });
    setQuote(copy);
    setUnlock(undefined);
    setShare(undefined);
    setDrawer(false);
  };
  const remove = (id: string) => {
    if (!window.confirm(t("b.deleteConfirm"))) return;
    quotesStore.remove(id);
    const rest = quotesStore.all();
    setQuotes(rest);
    if (quote?.id === id) {
      if (rest[0]) {
        setQuote(rest[0].quote);
        setUnlock(rest[0].unlock);
        setShare(rest[0].share);
      } else {
        setQuote(createQuoteFromProfile());
        setUnlock(undefined);
        setShare(undefined);
      }
    }
  };

  const applyDraft = (d: { subject: string; notes: string; paymentTerms: string; items: LineItem[] }, mode: "replace" | "append") => {
    if (!quote) return;
    track("ai_draft_apply", { mode });
    const existing = quote.items.filter((i) => i.description.trim() || i.unitPrice);
    update({
      items: mode === "replace" ? d.items : [...existing, ...d.items],
      subject: mode === "replace" || !quote.subject ? d.subject : quote.subject,
      notes: mode === "replace" || !quote.notes ? d.notes : quote.notes,
      paymentTerms: mode === "replace" || !quote.paymentTerms ? d.paymentTerms : quote.paymentTerms,
    });
    setOpen((o) => ({ ...o, items: true, notes: true }));
  };

  const errorMessage = (e: unknown): string => {
    if (e instanceof ApiError) {
      if (e.code === "rate_limited") return t("common.rateLimited");
      if (e.code === "invalid_quote") return t("b.errors.invalidQuote", { msg: e.message });
      if (e.code === "payments_disabled") return t("b.paywall.paymentsDisabled");
      if (e.code === "stripe_error") return t("b.errors.payments", { msg: e.message });
    }
    return t("common.error");
  };

  const downloadFree = async () => {
    if (!quote) return;
    setBusy("free");
    track("pdf_preview");
    try {
      const r = await api.pdf(quote, {});
      downloadBlob(r.blob, r.filename);
    } catch (e) {
      show(errorMessage(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const downloadPaid = async () => {
    if (!quote) return;
    setBusy("paid");
    try {
      if (license.lic) {
        let token = license.lic.token;
        if (license.status === "expired") token = (await license.refresh()) ?? token;
        try {
          const r = await api.pdf(quote, { license: token });
          downloadBlob(r.blob, r.filename);
          return;
        } catch (e) {
          if (e instanceof ApiError && e.status === 402) {
            const fresh = await license.refresh();
            if (fresh) {
              const r = await api.pdf(quote, { license: fresh });
              downloadBlob(r.blob, r.filename);
              return;
            }
            if (!unlock) {
              show(t("b.errors.licenseExpired"), "error");
              setProOpen(true);
              return;
            }
          } else throw e;
        }
      }
      if (unlock) {
        const r = await api.pdf(quote, { unlock });
        downloadBlob(r.blob, r.filename);
        return;
      }
      track("paywall_open");
      setPaywall(true);
    } catch (e) {
      show(errorMessage(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const startCheckout = async (plan: PlanId) => {
    if (!quote) return;
    setBusyPlan(plan);
    track("checkout_start", { plan, source: "app" });
    try {
      quotesStore.save({ quote, unlock, share });
      const { url } = await api.checkout(plan, plan === "single" ? quote.id : undefined, locale);
      window.location.href = url;
    } catch (e) {
      show(errorMessage(e), "error");
      setBusyPlan(null);
    }
  };

  const openShare = () => {
    if (!quote) return;
    if (!config.sharing) {
      show(t("b.share.disabled"), "error");
      return;
    }
    if (license.status !== "active" && !unlock) {
      show(t("b.share.requiresPaid"));
      setPaywall(true);
      return;
    }
    setShareOpen(true);
  };

  if (!quote) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">{t("common.loading")}</div>;
  }

  const hasEntitlement = license.status === "active" || Boolean(unlock);
  const priceLabel = formatPrice(config.pricing.single, config.pricing.currency, locale);
  const paidLabel = license.status === "active" ? t("b.downloadPro") : unlock ? t("b.downloadUnlocked") : t("b.downloadPaid", { price: priceLabel });

  const toggle = (k: SectionKey) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <Logo />
            </div>
            <Link href="/" className="sm:hidden" aria-label="Home">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-amber-300">
                <Icon name="bolt" className="h-5 w-5" />
              </span>
            </Link>
            <span className="hidden text-slate-300 sm:inline">/</span>
            <span className="truncate whitespace-nowrap text-sm font-medium text-slate-700">{quote.number}</span>
            {unlock ? <Badge tone="green">{t("b.unlocked")}</Badge> : null}
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <span className="hidden text-xs text-slate-400 md:inline">{t("b.saved")}</span>
            <Button variant="ghost" size="sm" onClick={() => setDrawer(true)}>
              <Icon name="list" className="h-4 w-4" /> <span className="hidden sm:inline">{t("b.myQuotes")}</span>
            </Button>
            <Button variant={license.status === "active" ? "secondary" : "ghost"} size="sm" onClick={() => setProOpen(true)}>
              <Icon name={license.status === "active" ? "star" : "lock"} className="h-4 w-4" />
              <span className="hidden sm:inline">{license.status === "active" ? t("b.pro.active") : "Pro"}</span>
            </Button>
            <div className="hidden sm:block">
              <LocaleSwitch />
            </div>
          </div>
        </div>
      </header>

      {/* mobile tabs */}
      <div className="mx-auto mt-3 flex max-w-7xl px-4 lg:hidden">
        <div className="inline-flex w-full rounded-lg bg-slate-200 p-0.5 text-sm font-medium">
          {(["edit", "preview"] as const).map((tab) => (
            <button key={tab} onClick={() => setMobileTab(tab)} className={cx("flex-1 rounded-md py-1.5", mobileTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-600")}>
              {tab === "edit" ? t("b.title") : t("b.preview")}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* editor */}
        <div className={cx("space-y-4", mobileTab === "preview" && "hidden lg:block")}>
          <div className="flex flex-wrap gap-2">
            <Button variant="accent" onClick={() => setAiOpen(true)}>
              <Icon name="sparkles" className="h-4 w-4" /> {t("b.ai.button")}
            </Button>
            <Button variant="secondary" onClick={createNew}>
              <Icon name="plus" className="h-4 w-4" /> {t("b.newQuote")}
            </Button>
          </div>

          <Section k="details" open={open.details} onToggle={toggle} title={t("b.sections.details")}>
            <DetailsForm quote={quote} onChange={update} />
          </Section>
          <Section k="sender" open={open.sender} onToggle={toggle} title={t("b.sections.sender")} right={<span className="text-xs text-slate-400">{t("b.senderHint")}</span>}>
            <PartyForm party={quote.sender} onChange={(p) => update({ sender: p })} isSender />
          </Section>
          <Section k="client" open={open.client} onToggle={toggle} title={t("b.sections.client")}>
            <PartyForm party={quote.client} onChange={(p) => update({ client: p })} />
          </Section>
          <Section k="items" open={open.items} onToggle={toggle} title={t("b.sections.items")}>
            <ItemsEditor quote={quote} onChange={(items) => update({ items })} />
          </Section>
          <Section k="options" open={open.options} onToggle={toggle} title={t("b.sections.options")}>
            <OptionsForm quote={quote} onChange={update} />
          </Section>
          <Section k="notes" open={open.notes} onToggle={toggle} title={t("b.sections.notes")}>
            <div className="space-y-3">
              <Field label={t("b.notes")}>
                <Textarea value={quote.notes ?? ""} onChange={(e) => update({ notes: e.target.value })} placeholder={t("b.notesPh")} rows={3} />
              </Field>
              <Field label={t("b.paymentTerms")}>
                <Textarea value={quote.paymentTerms ?? ""} onChange={(e) => update({ paymentTerms: e.target.value })} placeholder={t("b.paymentTermsPh")} rows={2} />
              </Field>
            </div>
          </Section>
          <Section k="branding" open={open.branding} onToggle={toggle} title={t("b.sections.branding")}>
            <BrandingForm branding={quote.branding} onChange={(b) => update({ branding: b })} />
          </Section>
        </div>

        {/* preview */}
        <div className={cx("lg:sticky lg:top-20 lg:self-start", mobileTab === "edit" && "hidden lg:block")}>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
            <div className="max-h-[calc(100vh-11rem)] overflow-auto">
              <QuotePreview quote={quote} watermark={!hasEntitlement} />
            </div>
          </div>
        </div>
      </main>

      {/* action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-2 px-4 py-3">
          {config.sharing ? (
            <Button variant="secondary" onClick={openShare} disabled={busy !== null || quote.items.length === 0}>
              <Icon name="external" className="h-4 w-4" /> {t("b.share.button")}
              {share?.status ? <Badge tone={share.status === "accepted" ? "green" : share.status === "declined" ? "amber" : share.status === "viewed" ? "indigo" : "slate"}>{t(`b.share.status.${share.status}`)}</Badge> : null}
            </Button>
          ) : null}
          <Button variant="secondary" onClick={downloadFree} loading={busy === "free"} disabled={busy !== null || quote.items.length === 0}>
            <Icon name="file" className="h-4 w-4" /> {busy === "free" ? t("b.downloading") : t("b.downloadFree")}
          </Button>
          <Button onClick={downloadPaid} loading={busy === "paid"} disabled={busy !== null || quote.items.length === 0} size="lg">
            <Icon name={hasEntitlement ? "download" : "unlock"} className="h-5 w-5" /> {busy === "paid" ? t("b.downloading") : paidLabel}
          </Button>
        </div>
      </div>

      <AiDraftModal open={aiOpen} onClose={() => setAiOpen(false)} quote={quote} enabled={config.ai} onApply={applyDraft} />
      <PaywallModal
        open={paywall}
        onClose={() => setPaywall(false)}
        config={config}
        onChoose={startCheckout}
        busyPlan={busyPlan}
        onHaveKey={() => {
          setPaywall(false);
          setProOpen(true);
        }}
      />
      <ProPanel
        open={proOpen}
        onClose={() => setProOpen(false)}
        license={license}
        config={config}
        notify={show}
        onUpgrade={() => {
          setProOpen(false);
          setPaywall(true);
        }}
      />
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        quote={quote}
        auth={{ license: license.status === "active" ? license.lic?.token : undefined, unlock }}
        share={share}
        onShareChange={setShare}
        notify={show}
      />
      <QuotesDrawer open={drawer} onClose={() => setDrawer(false)} quotes={quotes} currentId={quote.id} onSelect={selectQuote} onNew={createNew} onDuplicate={duplicate} onDelete={remove} />
      <Toast message={toast?.message ?? null} tone={toast?.tone} />
    </div>
  );
}
