import type { MetadataRoute } from "next";
import { SERVICES } from "@/data/services";
import { syncLive } from "@/lib/live-data";
import { SITE } from "@/data/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await syncLive();
  const now = new Date();
  return [
    { url: SITE.url, lastModified: now, priority: 1 },
    { url: `${SITE.url}/services`, lastModified: now, priority: 0.9 },
    { url: `${SITE.url}/pricing`, lastModified: now, priority: 0.8 },
    { url: `${SITE.url}/quote`, lastModified: now, priority: 0.8 },
    { url: `${SITE.url}/privacy`, lastModified: now, priority: 0.3 },
    { url: `${SITE.url}/terms`, lastModified: now, priority: 0.3 },
    ...SERVICES.map((s) => ({ url: `${SITE.url}/services/${s.slug}`, lastModified: now, priority: 0.7 })),
  ];
}
