import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CityGuide } from "@/components/CityGuide";
import { Breadcrumbs } from "@/components/Shell";
import { WeatherPage } from "@/components/WeatherPage";
import { cityBySlug, cityPath, nearbyCities, type City } from "@/lib/cities";
import { conditionLabel } from "@/lib/conditions";
import { formatTempUnit } from "@/lib/format";
import { loadNow, loadPlace, type Outcome } from "@/lib/load";
import { parseUnits, placeRegion } from "@/lib/query";
import { cityTrail, citySchema, pageMeta } from "@/lib/seo";
import { SITE_NAME, jsonLd } from "@/lib/site";
import type { Units } from "@/lib/types";

function describe(city: City, outcome: Outcome, units: Units): string {
  const now =
    outcome.kind === "ok"
      ? `${formatTempUnit(outcome.snapshot.current.temp, units)} and ${conditionLabel(
          outcome.snapshot.current.condition,
          outcome.snapshot.current.isDay,
        ).toLowerCase()} in ${city.name} now. `
      : "";
  return `${now}Hourly and 5-day forecast, rain chance, AQI and monthly climate for ${city.name}, ${placeRegion(city)}. ${city.nameUr} کا موسم`;
}

export async function generateMetadata({ params, searchParams }: PageProps<"/weather/[city]">): Promise<Metadata> {
  const city = cityBySlug((await params).city);
  if (!city) return {};
  const units = parseUnits(await searchParams);
  const outcome = await loadPlace(city);
  return pageMeta({
    title: `${city.name} Weather Today: Hourly & 5-Day Forecast · ${SITE_NAME}`,
    description: describe(city, outcome, units),
    path: cityPath(city),
    // The °F view is the same page, and an error shouldn't replace a good page in the index.
    noindex: units === "imperial" || outcome.kind !== "ok",
  });
}

export default async function CityPage({ params, searchParams }: PageProps<"/weather/[city]">) {
  const city = cityBySlug((await params).city);
  if (!city) notFound();
  const units = parseUnits(await searchParams);
  const nearby = nearbyCities(city);
  const [outcome, now] = await Promise.all([loadPlace(city), loadNow(nearby)]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(citySchema(city, describe(city, outcome, "metric"))) }}
      />
      <WeatherPage
        outcome={outcome}
        units={units}
        region={city.province}
        basePath={cityPath(city)}
        nameUr={city.nameUr}
        crumbs={<Breadcrumbs trail={cityTrail(city)} />}
      >
        {outcome.kind === "ok" && (
          <CityGuide
            city={city}
            month={new Date((outcome.snapshot.observedAt + outcome.snapshot.timezoneOffset) * 1000).getUTCMonth()}
            nearby={nearby}
            now={now}
            units={units}
          />
        )}
      </WeatherPage>
    </>
  );
}
