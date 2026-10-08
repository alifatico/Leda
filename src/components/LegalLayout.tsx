"use client";

import { SiteFooter, SiteHeader } from "./SiteChrome";

export function LegalLayout({ title, updated, children, supportEmail, businessName }: { title: string; updated: string; children: React.ReactNode; supportEmail: string; businessName: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{updated}</p>
        <div className="prose-sm mt-8 space-y-6 text-slate-700 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed">{children}</div>
      </main>
      <SiteFooter supportEmail={supportEmail} businessName={businessName} />
    </div>
  );
}
