import type { MetadataRoute } from "next";

import { CITIES, PROVINCES, cityPath, provincePath } from "@/lib/cities";
import { siteUrl } from "@/lib/site";

/** Every indexable page. Live weather means their content really does change all the time. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const lastModified = new Date();
  const paths = ["/", "/air-quality", "/my-location", "/about", ...PROVINCES.map(provincePath), ...CITIES.map(cityPath)];
  return paths.map((path) => ({ url: new URL(path, base).toString(), lastModified }));
}
