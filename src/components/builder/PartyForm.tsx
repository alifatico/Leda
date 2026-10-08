"use client";

import { useLocale } from "@/lib/i18n/context";
import type { Party } from "@/lib/quote";
import { Field, Input } from "../ui";

export function PartyForm({ party, onChange, isSender }: { party: Party; onChange: (p: Party) => void; isSender?: boolean }) {
  const { t } = useLocale();
  const set = (k: keyof Party) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...party, [k]: e.target.value });
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
      <Field label={t("b.f.name")} className="sm:col-span-6">
        <Input value={party.name} onChange={set("name")} autoComplete="organization" />
      </Field>
      <Field label={t("b.f.vat")} className="sm:col-span-3">
        <Input value={party.vat ?? ""} onChange={set("vat")} placeholder="IT01234567890" />
      </Field>
      <Field label={t("b.f.taxCode")} className="sm:col-span-3">
        <Input value={party.taxCode ?? ""} onChange={set("taxCode")} />
      </Field>
      <Field label={t("b.f.address")} className="sm:col-span-6">
        <Input value={party.address ?? ""} onChange={set("address")} autoComplete="street-address" />
      </Field>
      <Field label={t("b.f.zip")} className="sm:col-span-1">
        <Input value={party.zip ?? ""} onChange={set("zip")} autoComplete="postal-code" />
      </Field>
      <Field label={t("b.f.city")} className="sm:col-span-3">
        <Input value={party.city ?? ""} onChange={set("city")} autoComplete="address-level2" />
      </Field>
      <Field label={t("b.f.province")} className="sm:col-span-1">
        <Input value={party.province ?? ""} onChange={set("province")} maxLength={4} />
      </Field>
      <Field label={t("b.f.country")} className="sm:col-span-1">
        <Input value={party.country ?? ""} onChange={set("country")} />
      </Field>
      <Field label={t("b.f.email")} className="sm:col-span-3">
        <Input value={party.email ?? ""} onChange={set("email")} type="email" autoComplete="email" />
      </Field>
      <Field label={t("b.f.phone")} className="sm:col-span-3">
        <Input value={party.phone ?? ""} onChange={set("phone")} type="tel" autoComplete="tel" />
      </Field>
      <Field label={t("b.f.pec")} className="sm:col-span-3">
        <Input value={party.pec ?? ""} onChange={set("pec")} type="email" />
      </Field>
      <Field label={t("b.f.sdi")} className="sm:col-span-3">
        <Input value={party.sdi ?? ""} onChange={set("sdi")} maxLength={7} />
      </Field>
      {isSender ? (
        <Field label={t("b.f.website")} className="sm:col-span-6">
          <Input value={party.website ?? ""} onChange={set("website")} placeholder="www.esempio.it" />
        </Field>
      ) : null}
    </div>
  );
}
