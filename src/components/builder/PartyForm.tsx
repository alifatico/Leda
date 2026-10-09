"use client";

import { useId, useState } from "react";
import { clientSummary, findClient, hasDetails, searchClients } from "@/lib/clients";
import { useLocale } from "@/lib/i18n/context";
import type { Party } from "@/lib/quote";
import { Field, Icon, Input, cx } from "../ui";

export function PartyForm({
  party,
  onChange,
  isSender,
  book,
  onForget,
}: {
  party: Party;
  onChange: (p: Party) => void;
  isSender?: boolean;
  /** Address book: when given, the name field suggests known clients and fills the whole card. */
  book?: Party[];
  onForget?: (name: string) => void;
}) {
  const { t } = useLocale();
  const set = (k: keyof Party) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...party, [k]: e.target.value });
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
      {book ? (
        <ClientNameField party={party} onChange={onChange} book={book} onForget={onForget} />
      ) : (
        <Field label={t("b.f.name")} className="sm:col-span-6">
          <Input value={party.name} onChange={set("name")} autoComplete="organization" />
        </Field>
      )}
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

/**
 * Name field with a dropdown of the clients used in earlier quotes. Picking one
 * (click, tap or Enter) fills every field of the card; typing the exact name of a
 * known client and leaving the field does the same, as long as the card is empty.
 */
function ClientNameField({ party, onChange, book, onForget }: { party: Party; onChange: (p: Party) => void; book: Party[]; onForget?: (name: string) => void }) {
  const { t } = useLocale();
  const listId = useId();
  const [focused, setFocused] = useState(false);
  // closed with Escape or right after a pick, until the text changes again
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(0);

  const matches = focused && !dismissed ? searchClients(book, party.name) : [];
  const open = matches.length > 0;
  const activeIdx = Math.min(active, Math.max(matches.length - 1, 0));

  const pick = (p: Party) => {
    onChange({ ...p });
    setDismissed(true);
    setActive(0);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" && dismissed) {
        e.preventDefault();
        setDismissed(false);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((activeIdx + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((activeIdx - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(matches[activeIdx]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setDismissed(true);
    }
  };

  const onBlur = () => {
    setFocused(false);
    if (hasDetails(party)) return;
    const known = findClient(book, party.name);
    if (known) onChange({ ...known });
  };

  return (
    <div className="relative sm:col-span-6">
      <Field label={t("b.f.name")}>
        <Input
          value={party.name}
          onChange={(e) => {
            onChange({ ...party, name: e.target.value });
            setDismissed(false);
            setActive(0);
          }}
          onFocus={() => {
            setFocused(true);
            setDismissed(false);
          }}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open ? `${listId}-${activeIdx}` : undefined}
        />
      </Field>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("b.clientBook.title")}
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <li className="flex items-center gap-1.5 px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <Icon name="users" className="h-3.5 w-3.5" /> {t("b.clientBook.title")}
          </li>
          {matches.map((p, i) => (
            <li
              key={p.name}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              className={cx("flex cursor-pointer items-center gap-2 px-3 py-2", i === activeIdx ? "bg-indigo-50" : "hover:bg-slate-50")}
              // mousedown (not click) so the input keeps focus and the pick lands before any blur
              onMouseDown={(e) => {
                e.preventDefault();
                pick(p);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-900">{p.name}</div>
                {clientSummary(p) ? <div className="truncate text-xs text-slate-500">{clientSummary(p)}</div> : null}
              </div>
              {onForget ? (
                <button
                  type="button"
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                  title={t("b.clientBook.forget")}
                  aria-label={t("b.clientBook.forget")}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onForget(p.name);
                  }}
                >
                  <Icon name="x" className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
