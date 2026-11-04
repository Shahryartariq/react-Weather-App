export const SITE_NAME = "Skycast";

export const SITE_DESCRIPTION =
  "Live Pakistan weather for 50 cities: temperature, rain, air quality and 5-day forecasts for Karachi, Lahore, Islamabad and the northern areas. Free and ad-free.";

export const AUTHOR = { name: "Muhammad Shehryar", url: "https://github.com/Shahryartariq" };
export const SOURCE_URL = "https://github.com/Shahryartariq/skycast";

/** The production address. Vercel's own project URL (skycast-mu-six.vercel.app) isn't the one we share. */
export const PRODUCTION_URL = "https://getskycast.vercel.app";

/**
 * The public address of the site, for canonical links, the sitemap and social cards.
 * SITE_URL wins; any Vercel deployment (production or preview) points search engines at production.
 * VERCEL_PROJECT_PRODUCTION_URL isn't used: it once sent every canonical link to an alias that returned 404.
 */
export function siteUrl(): URL {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return new URL(explicit);
  if (process.env.VERCEL) return new URL(PRODUCTION_URL);
  return new URL("http://localhost:3000");
}

/** Preview deployments have their own URLs and must stay out of search results. */
export const isPreviewDeployment = () => process.env.VERCEL_ENV === "preview";

/** JSON for a <script type="application/ld+json">, safe against "</script>" in the data. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
