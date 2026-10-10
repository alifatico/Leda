"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { api, ApiError } from "@/lib/client-api";
import { clientSummary, findClient, hasDetails, normalizeName, searchClients } from "@/lib/clients";
import type { CompanyHit } from "@/lib/company";
import type { CompanyLookupMode } from "@/lib/env";
import { useLocale } from "@/lib/i18n/context";
import type { Party } from "@/lib/quote";
import { vatDigits } from "@/lib/vat";
import { Button, Field, Icon, Input, Spinner, cx } from "../ui";

export function PartyForm({
  party,
  onChange,
  isSender,
  book,
  onForget,
  lookup,
}: {
  party: Party;
  onChange: (p: Party) => void;
  isSender?: boolean;
  /** Address book: when given, the name field suggests known clients and fills the whole card. */
  book?: Party[];
  onForget?: (name: string) => void;
  /** Business-register search: while typing ("autocomplete"), behind a button ("on-demand") or by VAT number only ("vat"). */
  lookup?: CompanyLookupMode;
}) {
  const { t } = useLocale();
  const set = (k: keyof Party) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...party, [k]: e.target.value });
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
      {book ? (
        <ClientNameField party={party} onChange={onChange} book={book} onForget={onForget} lookup={lookup ?? "off"} />
      ) : (
        <Field label={t("b.f.name")} className="sm:col-span-6">
          <Input value={party.name} onChange={set("name")} autoComplete="organization" />
        </Field>
      )}
      {book && lookup && lookup !== "off" ? (
        <VatLookupField party={party} onChange={onChange} />
      ) : (
        <Field label={t("b.f.vat")} className="sm:col-span-3">
          <Input value={party.vat ?? ""} onChange={set("vat")} placeholder="IT01234567890" />
        </Field>
      )}
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

type Remote = { q: string; status: "loading" | "done" | "error"; hits: CompanyHit[] };
type Option = { kind: "local"; party: Party } | { kind: "remote"; hit: CompanyHit };

const MIN_LOOKUP_CHARS = 3;
const LOOKUP_DELAY_MS = 450;
const POLL_EVERY_MS = 1500;
const POLL_MAX_MS = 180_000;

const hitSummary = (h: CompanyHit) => [h.city && h.province ? `${h.city} (${h.province})` : h.city, h.vat ?? h.taxCode].filter(Boolean).join(" · ");

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

/** Search the register; when the provider answers with a run, follow it until the records are in. */
async function fetchHits(q: string, signal: AbortSignal): Promise<CompanyHit[]> {
  const first = await api.company.search(q, signal);
  if ("hits" in first) return first.hits;
  const started = Date.now();
  while (Date.now() - started < POLL_MAX_MS) {
    await sleep(POLL_EVERY_MS, signal);
    const r = await api.company.run(first.runId, q, signal);
    if ("hits" in r) return r.hits;
  }
  throw new Error("timeout");
}

/**
 * Name field with a dropdown of the clients used in earlier quotes and, when the
 * server can reach it, of the companies in the business register (while typing,
 * or behind a button when every search is a run of some seconds). Picking one
 * (click, tap or Enter) fills every field of the card; typing the exact name of a
 * known client and leaving the field does the same, as long as the card is empty.
 */
function ClientNameField({
  party,
  onChange,
  book,
  onForget,
  lookup,
}: {
  party: Party;
  onChange: (p: Party) => void;
  book: Party[];
  onForget?: (name: string) => void;
  lookup: CompanyLookupMode;
}) {
  const { t } = useLocale();
  const listId = useId();
  const live = lookup === "autocomplete";
  const onDemand = lookup === "on-demand";
  // VIES knows VAT numbers only: the register is searched when the text is one
  const vatOnly = lookup === "vat";
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  // closed with Escape or right after a pick, until the text changes again
  const [dismissed, setDismissed] = useState(false);
  // the register is only searched for text the user typed, not for the name already there on focus
  const [typed, setTyped] = useState(false);
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState<Remote>({ q: "", status: "done", hits: [] });
  const searchRef = useRef<AbortController | null>(null);
  // id of the register row whose full card is being fetched
  const [pending, setPending] = useState<string | null>(null);
  const pendingRef = useRef<AbortController | null>(null);

  const q = party.name.trim();
  const showList = focused && !dismissed;
  const local = showList ? searchClients(book, party.name) : [];

  const runSearch = useCallback((query: string, keepPrefixHits: boolean) => {
    searchRef.current?.abort();
    const ctrl = new AbortController();
    searchRef.current = ctrl;
    // while typing, keep the rows found for a shorter prefix on screen until the narrower search answers
    setRemote((r) => ({ q: query, status: "loading", hits: keepPrefixHits && r.q && query.toLowerCase().startsWith(r.q.toLowerCase()) ? r.hits : [] }));
    fetchHits(query, ctrl.signal).then(
      (hits) => {
        if (!ctrl.signal.aborted) setRemote({ q: query, status: "done", hits });
      },
      () => {
        if (!ctrl.signal.aborted) setRemote({ q: query, status: "error", hits: [] });
      },
    );
    return ctrl;
  }, []);

  // autocomplete: search a moment after the user stops typing, cancel when the text changes
  const wantRemote = showList && typed && q.length >= MIN_LOOKUP_CHARS && (live || (vatOnly && vatDigits(q) !== null));
  useEffect(() => {
    if (!wantRemote) return;
    const started: { ctrl: AbortController | null } = { ctrl: null };
    const timer = setTimeout(() => {
      started.ctrl = runSearch(q, true);
    }, LOOKUP_DELAY_MS);
    return () => {
      clearTimeout(timer);
      started.ctrl?.abort();
    };
  }, [wantRemote, q, runSearch]);
  useEffect(
    () => () => {
      searchRef.current?.abort();
      pendingRef.current?.abort();
    },
    [],
  );

  const inFlight = remote.status === "loading" && remote.q === q;
  const searching = inFlight || (wantRemote && remote.q !== q);
  const remoteHits: CompanyHit[] = lookup !== "off" && showList && remote.q && q.toLowerCase().startsWith(remote.q.toLowerCase()) ? remote.hits : [];
  const remoteState = lookup !== "off" && remote.q === q ? remote.status : null;
  const noResults = !searching && remoteState === "done" && remoteHits.length === 0 && (onDemand || wantRemote);
  const options: Option[] = [...local.map((p) => ({ kind: "local" as const, party: p })), ...remoteHits.map((hit) => ({ kind: "remote" as const, hit }))];
  // on-demand mode reports errors and empty answers under the button, where they stay visible without focus
  const registryBlock = remoteHits.length > 0 || searching || ((live || vatOnly) && (remoteState === "error" || noResults));
  const open = showList && (options.length > 0 || registryBlock);
  const activeIdx = Math.min(active, Math.max(options.length - 1, 0));

  const cancelPending = () => {
    pendingRef.current?.abort();
    pendingRef.current = null;
    setPending(null);
  };
  const close = () => {
    setDismissed(true);
    setTyped(false);
    setActive(0);
  };
  const pick = (p: Party) => {
    onChange({ ...p });
    close();
  };
  const pickRemote = (hit: CompanyHit) => {
    if (hit.party) {
      pick(hit.party);
      return;
    }
    cancelPending();
    const ctrl = new AbortController();
    pendingRef.current = ctrl;
    setPending(hit.id);
    api.company.get(hit.id, ctrl.signal).then(
      (res) => {
        if (ctrl.signal.aborted) return;
        setPending(null);
        pick(res.party);
      },
      () => {
        if (ctrl.signal.aborted) return;
        setPending(null);
        // the card could not be fetched: keep at least what the search row knew
        pick({ name: hit.name, vat: hit.vat, taxCode: hit.taxCode, city: hit.city, province: hit.province, country: "Italia" });
      },
    );
  };
  const choose = (o: Option) => (o.kind === "local" ? pick(o.party) : pickRemote(o.hit));

  /** On-demand mode: one paid run per click, results in the same dropdown. */
  const startManualSearch = () => {
    if (!onDemand || q.length < MIN_LOOKUP_CHARS || inFlight) return;
    inputRef.current?.focus();
    setDismissed(false);
    setActive(local.length);
    runSearch(q, false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onDemand && (!open || options.length === 0)) {
      e.preventDefault();
      startManualSearch();
      return;
    }
    if (!open) {
      if (e.key === "ArrowDown" && dismissed) {
        e.preventDefault();
        setDismissed(false);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (options.length) setActive((activeIdx + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (options.length) setActive((activeIdx - 1 + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const o = options[activeIdx];
      if (o && !pending) choose(o);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setDismissed(true);
    }
  };

  const onBlur = () => {
    setFocused(false);
    // coming back to the field must not search the register again until something new is typed
    setTyped(false);
    if (hasDetails(party)) return;
    const known = findClient(book, party.name);
    if (known) onChange({ ...known });
  };

  const rowClass = (i: number) => cx("flex cursor-pointer items-center gap-2 px-3 py-2", i === activeIdx ? "bg-indigo-50" : "hover:bg-slate-50");
  const groupClass = "flex items-center gap-1.5 px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400";

  return (
    <div className="relative sm:col-span-6">
      <Field label={t("b.f.name")}>
        <Input
          ref={inputRef}
          value={party.name}
          onChange={(e) => {
            onChange({ ...party, name: e.target.value });
            setDismissed(false);
            setTyped(true);
            setActive(0);
            cancelPending();
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
          aria-activedescendant={open && options.length ? `${listId}-${activeIdx}` : undefined}
        />
      </Field>
      {onDemand ? (
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
          <span className={cx("text-xs", remoteState === "error" ? "text-amber-700" : "text-slate-500")}>
            {remoteState === "error" ? t("b.clientBook.unavailable") : noResults ? t("b.clientBook.noResults") : t("b.clientBook.searchHint")}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={q.length < MIN_LOOKUP_CHARS}
            loading={inFlight}
            // mousedown would move the focus off the input and close the list
            onMouseDown={(e) => e.preventDefault()}
            onClick={startManualSearch}
          >
            {inFlight ? null : <Icon name="globe" className="h-4 w-4" />} {t("b.clientBook.searchButton")}
          </Button>
        </div>
      ) : null}
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("b.clientBook.title")}
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {local.length > 0 ? (
            <li className={groupClass}>
              <Icon name="users" className="h-3.5 w-3.5" /> {t("b.clientBook.title")}
            </li>
          ) : null}
          {local.map((p, i) => (
            <li
              key={`l-${p.name}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              className={rowClass(i)}
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
          {registryBlock ? (
            <li className={cx(groupClass, local.length > 0 && "mt-1 border-t border-slate-100 pt-2")}>
              <Icon name="globe" className="h-3.5 w-3.5" /> {t("b.clientBook.registry")}
            </li>
          ) : null}
          {remoteHits.map((hit, j) => {
            const i = local.length + j;
            return (
              <li
                key={`r-${hit.id}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === activeIdx}
                className={rowClass(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (!pending) pickRemote(hit);
                }}
                onMouseEnter={() => setActive(i)}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-900">{hit.name}</div>
                  {hitSummary(hit) ? <div className="truncate text-xs text-slate-500">{hitSummary(hit)}</div> : null}
                </div>
                {pending === hit.id ? (
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-indigo-700">
                    <Spinner className="h-3.5 w-3.5" /> {t("b.clientBook.filling")}
                  </span>
                ) : null}
              </li>
            );
          })}
          {searching ? (
            <li className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
              <Spinner className="h-3.5 w-3.5" /> {t(onDemand ? "b.clientBook.searchingSlow" : "b.clientBook.searching")}
            </li>
          ) : (live || vatOnly) && remoteState === "error" ? (
            <li className="px-3 py-2 text-xs text-amber-700">{t("b.clientBook.unavailable")}</li>
          ) : (live || vatOnly) && noResults ? (
            <li className="px-3 py-2 text-xs text-slate-500">{t(vatOnly ? "b.clientBook.vatNoResults" : "b.clientBook.noResults")}</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

type VatLookup = { vat: string; status: "idle" | "loading" | "found" | "applied" | "notfound" | "error"; found?: Party };

/** Fill the empty fields of the card with what the register knows; the VAT number is always the register's. */
function mergeCard(current: Party, found: Party): Party {
  const out: Record<string, string | undefined> = { ...current };
  for (const [k, v] of Object.entries(found)) {
    if (v && !(out[k] ?? "").trim()) out[k] = v;
  }
  out.vat = found.vat ?? out.vat;
  return out as Party;
}

/**
 * VAT-number field of the client. Eleven digits typed or pasted (with or
 * without "IT") fetch the company from the register and fill the empty fields;
 * when a different name is already there, the find is offered with a button.
 */
function VatLookupField({ party, onChange }: { party: Party; onChange: (p: Party) => void }) {
  const { t } = useLocale();
  const [typed, setTyped] = useState(false);
  const [state, setState] = useState<VatLookup>({ vat: "", status: "idle" });
  const ctrlRef = useRef<AbortController | null>(null);
  const partyRef = useRef(party);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    partyRef.current = party;
    onChangeRef.current = onChange;
  });
  const vat = vatDigits(party.vat ?? "");

  useEffect(() => {
    if (!typed || !vat || vat === state.vat) return;
    const timer = setTimeout(() => {
      ctrlRef.current?.abort();
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;
      setState({ vat, status: "loading" });
      api.company.get(vat, ctrl.signal).then(
        (res) => {
          if (ctrl.signal.aborted) return;
          const current = partyRef.current;
          const conflict = current.name.trim() !== "" && normalizeName(current.name) !== normalizeName(res.party.name);
          if (conflict) {
            setState({ vat, status: "found", found: res.party });
          } else {
            onChangeRef.current(mergeCard(current, res.party));
            setState({ vat, status: "applied", found: res.party });
          }
        },
        (e) => {
          if (ctrl.signal.aborted) return;
          setState({ vat, status: e instanceof ApiError && e.status === 404 ? "notfound" : "error" });
        },
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [typed, vat, state.vat]);
  useEffect(() => () => ctrlRef.current?.abort(), []);

  const show = vat !== null && state.vat === vat ? state.status : "idle";
  const found = state.found;
  return (
    <Field label={t("b.f.vat")} className="sm:col-span-3">
      <Input
        value={party.vat ?? ""}
        onChange={(e) => {
          onChange({ ...party, vat: e.target.value });
          setTyped(true);
        }}
        placeholder="IT01234567890"
        autoComplete="off"
      />
      {show === "loading" ? (
        <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <Spinner className="h-3 w-3" /> {t("b.clientBook.vatSearching")}
        </span>
      ) : show === "applied" && found ? (
        <span className="mt-1 block text-xs text-emerald-700">{t("b.clientBook.vatFilled", { name: found.name })}</span>
      ) : show === "found" && found ? (
        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
          {t("b.clientBook.vatFound", { name: found.name })}
          <Button type="button" variant="secondary" size="sm" onClick={() => { onChange({ ...party, ...found }); setState({ vat: state.vat, status: "applied", found }); }}>
            {t("b.clientBook.vatUse")}
          </Button>
        </span>
      ) : show === "notfound" ? (
        <span className="mt-1 block text-xs text-amber-700">{t("b.clientBook.vatNotFound")}</span>
      ) : show === "error" ? (
        <span className="mt-1 block text-xs text-amber-700">{t("b.clientBook.vatUnavailable")}</span>
      ) : null}
    </Field>
  );
}
