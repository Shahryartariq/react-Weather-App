import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WeatherPage } from "@/components/WeatherPage";
import { cityBySlug, cityPath } from "@/lib/cities";
import { conditionLabel } from "@/lib/conditions";
import { formatTemp } from "@/lib/format";
import { loadPlace, loadWorld } from "@/lib/load";
import { parseUnits, placeLabel } from "@/lib/query";
import { SITE_NAME, jsonLd, siteUrl } from "@/lib/site";

export async function generateMetadata({ params, searchParams }: PageProps<"/weather/[city]">): Promise<Metadata> {
  const city = cityBySlug((await params).city);
  if (!city) return {};
  const units = parseUnits(await searchParams);
  const outcome = await loadPlace(city);
  const where = placeLabel(city);
  const now =
    outcome.kind === "ok"
      ? `Now ${formatTemp(outcome.snapshot.current.temp, units)} and ${conditionLabel(
          outcome.snapshot.current.condition,
          outcome.snapshot.current.isDay,
        ).toLowerCase()}. `
      : "";
  return {
    title: `${city.name} weather today`,
    description: `${now}Hourly and 5-day forecast for ${where}, with wind, humidity, air quality, sunrise and sunset.`,
    alternates: { canonical: cityPath(city) },
    // The °F view is the same page; keep it out of the index.
    robots: units === "imperial" ? { index: false, follow: true } : undefined,
    openGraph: { title: `${city.name} weather · ${SITE_NAME}`, url: cityPath(city) },
  };
}

export default async function CityPage({ params, searchParams }: PageProps<"/weather/[city]">) {
  const city = cityBySlug((await params).city);
  if (!city) notFound();
  const units = parseUnits(await searchParams);
  const [outcome, world] = await Promise.all([loadPlace(city), loadWorld(city.slug)]);

  const base = siteUrl();
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: new URL("/", base).toString() },
      { "@type": "ListItem", position: 2, name: `${city.name} weather`, item: new URL(cityPath(city), base).toString() },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      <WeatherPage
        outcome={outcome}
        units={units}
        basePath={cityPath(city)}
        keep={new URLSearchParams()}
        world={world}
        currentSlug={city.slug}
      />
    </>
  );
}
