import type { Metadata } from "next";
import { Suspense } from "react";
import Builder from "@/components/builder/Builder";
import { publicConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "Crea preventivo",
  robots: { index: false, follow: false },
};

export default function AppPage() {
  const config = publicConfig();
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-slate-500">…</div>}>
      <Builder config={config} />
    </Suspense>
  );
}
