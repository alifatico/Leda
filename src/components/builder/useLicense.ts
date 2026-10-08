"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { licenseStore, peekLicense, type StoredLicense } from "@/lib/storage";

export type LicenseStatus = "none" | "active" | "expired";

export type LicenseState = {
  lic: StoredLicense | null;
  status: LicenseStatus;
  activate: (token: string) => boolean;
  remove: () => void;
  refresh: () => Promise<string | null>;
};

type Snapshot = { lic: StoredLicense | null; status: LicenseStatus };

function snapshot(lic: StoredLicense | null): Snapshot {
  if (!lic) return { lic: null, status: "none" };
  return { lic, status: lic.exp * 1000 > Date.now() ? "active" : "expired" };
}

export function useLicense(): LicenseState {
  const [state, setState] = useState<Snapshot>({ lic: null, status: "none" });

  const refresh = useCallback(async (): Promise<string | null> => {
    const current = licenseStore.get();
    if (!current) return null;
    try {
      const r = await api.refreshLicense(current.token);
      const next = { ...current, token: r.license, exp: r.exp, plan: r.plan };
      licenseStore.save(next);
      setState(snapshot(next));
      return r.license;
    } catch {
      return null;
    }
  }, []);

  // Load from the browser after hydration and renew silently when the token is
  // about to expire (end of the billing period).
  useEffect(() => {
    const stored = licenseStore.get();
    const task = Promise.resolve().then(() => setState(snapshot(stored)));
    if (stored && stored.exp * 1000 < Date.now() + 2 * 24 * 3600 * 1000) void task.then(() => refresh());
  }, [refresh]);

  const activate = useCallback((token: string) => {
    const p = peekLicense(token);
    if (!p || p.kind !== "pro" || typeof p.exp !== "number") return false;
    const entry: StoredLicense = { token, exp: p.exp, plan: p.plan === "yearly" ? "yearly" : "monthly", email: p.email ?? null };
    licenseStore.save(entry);
    setState(snapshot(entry));
    return true;
  }, []);

  const remove = useCallback(() => {
    licenseStore.clear();
    setState(snapshot(null));
  }, []);

  return { lic: state.lic, status: state.status, activate, remove, refresh };
}
