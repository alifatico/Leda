import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";
import { professions } from "@/lib/professions";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/app`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/preventivo`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/preventivo-ai`, changeFrequency: "monthly", priority: 0.8 },
    ...professions.map((p) => ({ url: `${base}/preventivo/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/termini`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
