"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { dicts, lookup, type Locale, type TKey } from "./dict";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "pl.locale";
const listeners = new Set<() => void>();

export function detectLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "it" || stored === "en") return stored;
    const nav = (navigator.language || "it").toLowerCase();
    return nav.startsWith("it") ? "it" : "en";
  } catch {
    return "it";
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

const getServerSnapshot = (): Locale => "it";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // The server (and the hydration pass) render Italian; the browser preference
  // is applied right after hydration through the external-store snapshot.
  const locale = useSyncExternalStore(subscribe, detectLocale, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    listeners.forEach((cb) => cb());
  }, []);

  const value = useMemo<Ctx>(
    () => ({ locale, setLocale, t: (key, vars) => lookup(dicts[locale], key, vars) }),
    [locale, setLocale],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Ctx {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}
