import { BRAND } from "@/lib/brand";
import { Landing } from "@/components/Landing";
import { appUrl, businessEnv, publicConfig } from "@/lib/env";
import { it } from "@/lib/i18n/dict";

export default function HomePage() {
  const config = publicConfig();
  const faq = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
    "@type": "Question",
    name: it.faq[`q${n}` as keyof typeof it.faq],
    acceptedAnswer: { "@type": "Answer", text: it.faq[`a${n}` as keyof typeof it.faq] },
  }));
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: BRAND,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: appUrl(),
      description: it.meta.description,
      offers: [
        { "@type": "Offer", price: (config.pricing.single / 100).toFixed(2), priceCurrency: config.pricing.currency.toUpperCase(), name: "Preventivo PDF singolo" },
        { "@type": "Offer", price: (config.pricing.proMonthly / 100).toFixed(2), priceCurrency: config.pricing.currency.toUpperCase(), name: "Pro mensile" },
      ],
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Landing config={config} businessName={businessEnv.name()} />
    </>
  );
}
