export const SITE_NAME = "Skycast";

export const SITE_DESCRIPTION =
  "Live Pakistan weather for 50 cities: temperature, rain, air quality and 5-day forecasts for Karachi, Lahore, Islamabad and the northern areas. Free and ad-free.";

export const AUTHOR = { name: "Muhammad Shehryar", url: "https://github.com/Shahryartariq" };
export const SOURCE_URL = "https://github.com/Shahryartariq/skycast";

const PRODUCTION_URL = "https://getskycast.vercel.app";

/**
 * The public address of the site, for canonical links, the sitemap and social cards.
 * It's set here on purpose. VERCEL_PROJECT_PRODUCTION_URL once pointed every canonical link at
 * an auto-generated alias that returned 404. Set SITE_URL when moving to a custom domain.
 */
export function siteUrl(): URL {
  return new URL(process.env.SITE_URL?.trim() || PRODUCTION_URL);
}

/** Preview deployments have their own URLs and must stay out of search results. */
export const isPreviewDeployment = () => process.env.VERCEL_ENV === "preview";

/** JSON for a <script type="application/ld+json">, safe against "</script>" in the data. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
