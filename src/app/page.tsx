import type { Metadata } from "next";

import { WeatherPage } from "@/components/WeatherPage";
import { cityNear } from "@/lib/cities";
import { conditionLabel } from "@/lib/conditions";
import { formatTemp } from "@/lib/format";
import { loadFromQuery, loadWorld } from "@/lib/load";
import { parseUnits, placeLabel } from "@/lib/query";
import { AUTHOR, SITE_DESCRIPTION, SITE_NAME, SOURCE_URL, jsonLd, siteUrl } from "@/lib/site";

type Search = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/** The bare home page is indexed; lookups by coordinates or search text are not (they'd be duplicates). */
const isLookup = (params: Search) => Boolean(one(params.lat) || one(params.lon) || one(params.q));

export async function generateMetadata({ searchParams }: PageProps<"/">): Promise<Metadata> {
  const params: Search = await searchParams;
  const outcome = await loadFromQuery(one(params.lat), one(params.lon), one(params.q));
  const lookup = isLookup(params);
  const base: Metadata = {
    alternates: { canonical: "/" },
    robots: lookup || one(params.units) ? { index: false, follow: true } : undefined,
  };
  if (!lookup) {
    return { ...base, title: { absolute: `${SITE_NAME}: weather forecast for any city` }, description: SITE_DESCRIPTION };
  }
  if (outcome.kind !== "ok") return { ...base, title: { absolute: `Place not found · ${SITE_NAME}` } };
  const { place, current } = outcome.snapshot;
  const units = parseUnits(params);
  return {
    ...base,
    title: { absolute: `${place.name} weather · ${SITE_NAME}` },
    description: `${formatTemp(current.temp, units)} and ${conditionLabel(current.condition, current.isDay).toLowerCase()} in ${placeLabel(place)}. Hourly and 5-day forecast, wind, humidity and air quality.`,
  };
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const params: Search = await searchParams;
  const units = parseUnits(params);
  const outcome = await loadFromQuery(one(params.lat), one(params.lon), one(params.q));
  // Leave the city on screen out of "Around the world".
  const currentSlug =
    outcome.kind === "ok" ? cityNear(outcome.snapshot.place.lat, outcome.snapshot.place.lon)?.slug : undefined;
  const world = await loadWorld(currentSlug);

  const keep = new URLSearchParams();
  for (const name of ["lat", "lon", "q"] as const) {
    const value = one(params[name]);
    if (value) keep.set(name, value);
  }

  const url = siteUrl().toString();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url,
        description: SITE_DESCRIPTION,
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${url}?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "WebApplication",
        name: SITE_NAME,
        url,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires a modern web browser",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        author: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url },
        codeRepository: SOURCE_URL,
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <WeatherPage outcome={outcome} units={units} basePath="/" keep={keep} world={world} currentSlug={currentSlug} />
    </>
  );
}
