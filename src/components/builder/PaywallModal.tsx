"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/client-api";
import type { PlanId, PublicConfig } from "@/lib/env";
import { useLocale } from "@/lib/i18n/context";
import { Button, Icon, Modal, cx } from "../ui";

export function PaywallModal({
  open,
  onClose,
  config,
  onChoose,
  busyPlan,
  onHaveKey,
}: {
  open: boolean;
  onClose: () => void;
  config: PublicConfig;
  onChoose: (plan: PlanId) => void;
  busyPlan: PlanId | null;
  onHaveKey: () => void;
}) {
  const { t, locale } = useLocale();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const p = config.pricing;
  const proPlan: PlanId = interval === "monthly" ? "pro_monthly" : "pro_yearly";
  const proPrice = interval === "monthly" ? p.proMonthly : p.proYearly;

  return (
    <Modal open={open} onClose={onClose} title={t("b.paywall.title")} wide>
      <p className="mb-4 text-sm text-slate-600">{t("b.paywall.subtitle")}</p>
      {!config.payments ? <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t("b.paywall.paymentsDisabled")}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-slate-200 p-4">
          <div className="text-sm font-semibold text-slate-900">{t("b.paywall.single")}</div>
          <div className="mt-1 text-3xl font-bold text-slate-900">{formatPrice(p.single, p.currency, locale)}</div>
          <p className="mt-1 flex-1 text-xs text-slate-500">{t("b.paywall.singleDesc")}</p>
          <Button className="mt-4" variant="secondary" onClick={() => onChoose("single")} loading={busyPlan === "single"} disabled={!config.payments || busyPlan !== null}>
            <Icon name="download" className="h-4 w-4" /> {t("b.downloadPaid", { price: formatPrice(p.single, p.currency, locale) })}
          </Button>
        </div>
        <div className="relative flex flex-col rounded-xl border-2 border-indigo-600 p-4">
          <span className="absolute -top-2.5 right-3 rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-semibold text-white">{t("pricing.popular")}</span>
          <div className="text-sm font-semibold text-slate-900">{t("b.paywall.pro")}</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">{formatPrice(proPrice, p.currency, locale)}</span>
            <span className="text-sm text-slate-500">{interval === "monthly" ? t("pricing.perMonth") : t("pricing.perYear")}</span>
          </div>
          <div className="mt-2 inline-flex self-start rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
            {(["monthly", "yearly"] as const).map((i) => (
              <button key={i} onClick={() => setInterval(i)} className={cx("rounded-md px-2 py-1", interval === i ? "bg-white shadow-sm text-slate-900" : "text-slate-600")}>
                {i === "monthly" ? t("b.paywall.monthly") : t("b.paywall.yearly")}
              </button>
            ))}
          </div>
          <p className="mt-2 flex-1 text-xs text-slate-500">{t("b.paywall.proDesc")}</p>
          <Button className="mt-4" onClick={() => onChoose(proPlan)} loading={busyPlan === proPlan} disabled={!config.payments || busyPlan !== null}>
            <Icon name="bolt" className="h-4 w-4" /> {t("pricing.proCta")}
          </Button>
        </div>
      </div>
      {config.sharing ? <p className="mt-3 text-center text-xs text-slate-600">{t("b.paywall.includesShare")}</p> : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Icon name="lock" className="h-3.5 w-3.5" /> {t("b.paywall.secure")}
        </span>
        <button className="font-medium text-indigo-600 hover:underline" onClick={onHaveKey}>
          {t("b.paywall.haveKey")}
        </button>
      </div>
    </Modal>
  );
}
