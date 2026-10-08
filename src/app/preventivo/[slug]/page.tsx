import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfessionPage } from "@/components/ProfessionPage";
import { appUrl, businessEnv, getPricing } from "@/lib/env";
import { getProfession, professions } from "@/lib/professions";

export function generateStaticParams() {
  return professions.map((p) => ({ slug: p.slug }));
}


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProfession(slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.metaDescription,
    alternates: { canonical: `${appUrl()}/preventivo/${p.slug}` },
    openGraph: { title: p.title, description: p.metaDescription, type: "article" },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProfession(slug);
  if (!p) notFound();
  const pricing = getPricing();
  const singlePrice = new Intl.NumberFormat("it-IT", { style: "currency", currency: pricing.currency.toUpperCase() }).format(pricing.single / 100);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: p.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProfessionPage p={p} supportEmail={businessEnv.supportEmail()} businessName={businessEnv.name()} singlePrice={singlePrice} />
    </>
  );
}
