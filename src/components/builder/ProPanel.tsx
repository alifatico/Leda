"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/client-api";
import type { PublicConfig } from "@/lib/env";
import { useLocale } from "@/lib/i18n/context";
import { Badge, Button, Icon, Input, Modal } from "../ui";
import type { LicenseState } from "./useLicense";

export function ProPanel({
  open,
  onClose,
  license,
  config,
  onUpgrade,
  notify,
}: {
  open: boolean;
  onClose: () => void;
  license: LicenseState;
  config: PublicConfig;
  onUpgrade: () => void;
  notify: (msg: string, tone?: "info" | "error" | "success") => void;
}) {
  const { t, locale } = useLocale();
  const [key, setKey] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"activate" | "recover" | "portal" | null>(null);

  const activate = () => {
    if (license.activate(key.trim())) {
      notify(t("b.pro.activated"), "success");
      setKey("");
    } else notify(t("b.pro.invalidKey"), "error");
  };

  const recover = async () => {
    setBusy("recover");
    try {
      await api.recoverLicense(email.trim(), locale);
      notify(t("b.pro.recoverSent"), "success");
      setEmail("");
    } catch (e) {
      if (e instanceof ApiError && e.code === "recovery_unavailable") notify(t("b.pro.recoverUnavailable", { email: config.supportEmail }), "error");
      else if (e instanceof ApiError && e.code === "rate_limited") notify(t("common.rateLimited"), "error");
      else notify(t("common.error"), "error");
    } finally {
      setBusy(null);
    }
  };

  const portal = async () => {
    if (!license.lic) return;
    setBusy("portal");
    try {
      const { url } = await api.portal(license.lic.token);
      window.location.href = url;
    } catch {
      notify(t("common.error"), "error");
      setBusy(null);
    }
  };

  const expDate = license.lic ? new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-GB", { dateStyle: "long" }).format(new Date(license.lic.exp * 1000)) : "";

  return (
    <Modal open={open} onClose={onClose} title={t("b.pro.title")}>
      {license.lic ? (
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">{t("b.pro.plan", { plan: license.lic.plan === "yearly" ? t("b.pro.yearly") : t("b.pro.monthly") })}</span>
            <Badge tone={license.status === "active" ? "green" : "amber"}>{license.status === "active" ? t("b.pro.active") : t("b.pro.expired")}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">{license.status === "active" ? t("b.pro.renews", { date: expDate }) : t("b.pro.expired")}</p>
          {license.lic.email ? <p className="text-xs text-slate-400">{license.lic.email}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={portal} loading={busy === "portal"}>
              <Icon name="settings" className="h-4 w-4" /> {t("b.pro.manage")}
            </Button>
            <Button variant="danger" size="sm" onClick={license.remove}>
              {t("b.pro.remove")}
            </Button>
          </div>
        </div>
      ) : (
        <Button className="w-full" onClick={onUpgrade}>
          <Icon name="bolt" className="h-4 w-4" /> {t("b.pro.upgrade")}
        </Button>
      )}

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-800">{t("b.pro.activateTitle")}</h3>
        <div className="mt-2 flex gap-2">
          <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder={t("b.pro.activatePlaceholder")} className="font-mono text-xs" />
          <Button variant="secondary" onClick={activate} disabled={!key.trim()}>
            {t("b.pro.activate")}
          </Button>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-800">{t("b.pro.recoverTitle")}</h3>
        <p className="mt-1 text-xs text-slate-500">{t("b.pro.recoverText")}</p>
        <div className="mt-2 flex gap-2">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("b.pro.recoverPlaceholder")} />
          <Button variant="secondary" onClick={recover} loading={busy === "recover"} disabled={!/^\S+@\S+\.\S+$/.test(email)}>
            <Icon name="mail" className="h-4 w-4" /> {t("b.pro.recover")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
