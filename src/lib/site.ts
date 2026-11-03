export const SITE_NAME = "Skycast";

export const SITE_DESCRIPTION =
  "Live weather for any city: current conditions, the next 24 hours and a 5-day forecast, with wind, humidity, air quality and sunrise times. Free, fast and ad-free.";

export const AUTHOR = { name: "Muhammad Shehryar", url: "https://github.com/Shahryartariq" };
export const SOURCE_URL = "https://github.com/Shahryartariq/skycast";

/**
 * The public address of the site, for canonical links, the sitemap and social cards.
 * SITE_URL wins; on Vercel the production domain is provided automatically.
 */
export function siteUrl(): URL {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return new URL(explicit);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return new URL(`https://${vercel}`);
  return new URL("http://localhost:3000");
}

/** JSON for a <script type="application/ld+json">, safe against "</script>" in the data. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
