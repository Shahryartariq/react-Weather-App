export const SITE_NAME = "Skycast";

export const SITE_DESCRIPTION =
  "Live weather for any city: current conditions, the next 24 hours and a 5-day forecast, with wind, humidity, air quality and sunrise times. Free, fast and ad-free.";

export const AUTHOR = { name: "Muhammad Shehryar", url: "https://github.com/Shahryartariq" };
export const SOURCE_URL = "https://github.com/Shahryartariq/skycast";

/** The production address. Vercel's own project URL (skycast-mu-six.vercel.app) isn't the one we share. */
export const PRODUCTION_URL = "https://getskycast.vercel.app";

/**
 * The public address of the site, for canonical links, the sitemap and social cards.
 * SITE_URL wins; any Vercel deployment (production or preview) points search engines at production.
 */
export function siteUrl(): URL {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return new URL(explicit);
  if (process.env.VERCEL) return new URL(PRODUCTION_URL);
  return new URL("http://localhost:3000");
}

/** JSON for a <script type="application/ld+json">, safe against "</script>" in the data. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
