import type { Metadata } from "next";
import { Suspense } from "react";
import { SuccessClient } from "@/components/SuccessClient";
import { businessEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Pagamento", robots: { index: false, follow: false } };

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessClient supportEmail={businessEnv.supportEmail()} />
    </Suspense>
  );
}
