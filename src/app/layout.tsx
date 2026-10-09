import { BRAND } from "@/lib/brand";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { LocaleProvider } from "@/lib/i18n/context";
import { it } from "@/lib/i18n/dict";
import { analyticsEnv, appUrl } from "@/lib/env";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: it.meta.title, template: `%s · ${BRAND}` },
  description: it.meta.description,
  applicationName: BRAND,
  keywords: ["preventivo", "preventivo pdf", "modello preventivo", "preventivo online", "preventivo forfettario", "ritenuta d'acconto", "rivalsa inps", "preventivo freelance"],
  openGraph: {
    type: "website",
    locale: "it_IT",
    alternateLocale: "en_GB",
    siteName: BRAND,
    title: it.meta.title,
    description: it.meta.description,
  },
  twitter: { card: "summary_large_image", title: it.meta.title, description: it.meta.description },
  robots: { index: true, follow: true },
  verification: analyticsEnv.googleSiteVerification() ? { google: analyticsEnv.googleSiteVerification() } : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const plausible = analyticsEnv.plausibleDomain();
  return (
    <html lang="it" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LocaleProvider>{children}</LocaleProvider>
        {plausible ? <Script defer data-domain={plausible} src="https://plausible.io/js/script.js" strategy="afterInteractive" /> : null}
      </body>
    </html>
  );
}
