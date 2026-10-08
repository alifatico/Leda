import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SharedQuoteView } from "@/components/SharedQuoteView";
import { getShare, requestTime, toPublic } from "@/lib/share";

export const metadata: Metadata = { title: "Preventivo", robots: { index: false, follow: false } };

export default function SharedQuotePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-slate-500">…</div>}>
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rec = await getShare(id);
  if (!rec) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 px-4 text-center">
        <p className="text-xl font-semibold text-slate-900">Link non valido o disattivato · Invalid or disabled link</p>
        <p className="text-slate-600">Chiedi a chi ti ha inviato il preventivo un nuovo link. · Ask the sender for a new link.</p>
        <Link href="/" className="mt-2 text-sm font-medium text-indigo-600">
          Preventivo Lampo
        </Link>
      </div>
    );
  }
  return <SharedQuoteView data={toPublic(rec)} now={requestTime()} />;
}
