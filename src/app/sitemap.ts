import type { MetadataRoute } from "next";

import { CITIES, cityPath } from "@/lib/cities";
import { siteUrl } from "@/lib/site";

/** The home page and every city page. Weather changes all the time, so pages are marked hourly. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();
  return [
    { url: new URL("/", base).toString(), lastModified: now, changeFrequency: "hourly", priority: 1 },
    ...CITIES.map((city) => ({
      url: new URL(cityPath(city), base).toString(),
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
  ];
}
