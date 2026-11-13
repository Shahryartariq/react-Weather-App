import type { Metadata } from "next";

import { CityCards } from "@/components/Cities";
import { Nation } from "@/components/Nation";
import { Shell } from "@/components/Shell";
import { WeatherPage } from "@/components/WeatherPage";
import { CITIES, MAJOR } from "@/lib/cities";
import { conditionLabel } from "@/lib/conditions";
import { formatTemp } from "@/lib/format";
import { loadFromQuery, loadNation, loadNationAir, loadNow, nationSky } from "@/lib/load";
import { parseLocation, parseUnits, placeLabel } from "@/lib/query";
import { homeSchema, pageMeta } from "@/lib/seo";
import { SITE_DESCRIPTION, SITE_NAME, jsonLd } from "@/lib/site";

type Search = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export async function generateMetadata({ searchParams }: PageProps<"/">): Promise<Metadata> {
  const params: Search = await searchParams;
  const noindex = Object.keys(params).length > 0; // Only the bare home page is indexed.
  if (parseLocation(params).kind === "default") {
    return pageMeta({
      title: `Pakistan Weather Today: Live Forecast for ${CITIES.length} Cities · ${SITE_NAME}`,
      description: SITE_DESCRIPTION,
      path: "/",
      noindex,
    });
  }

  const outcome = await loadFromQuery(one(params.lat), one(params.lon), one(params.q));
  if (outcome.kind !== "ok") {
    return pageMeta({ title: `Place not found · ${SITE_NAME}`, description: SITE_DESCRIPTION, path: "/", noindex: true });
  }
  const { place, current } = outcome.snapshot;
  const condition = conditionLabel(current.condition, current.isDay).toLowerCase();
  return pageMeta({
    title: `${place.name} weather · ${SITE_NAME}`,
    description: `${formatTemp(current.temp, parseUnits(params))} and ${condition} in ${placeLabel(place)}. Hourly and 5-day forecast, wind, humidity and air quality.`,
    path: "/",
    noindex: true,
  });
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const params: Search = await searchParams;
  const units = parseUnits(params);

  if (parseLocation(params).kind !== "default") {
    const majors = CITIES.filter((city) => MAJOR.includes(city.slug));
    const [outcome, now] = await Promise.all([
      loadFromQuery(one(params.lat), one(params.lon), one(params.q)),
      loadNow(majors),
    ]);
    const keep = new URLSearchParams();
    for (const name of ["lat", "lon", "q"] as const) {
      const value = one(params[name]);
      if (value) keep.set(name, value);
    }
    return (
      <WeatherPage outcome={outcome} units={units} basePath="/" keep={keep}>
        <section className="section" aria-labelledby="major-title">
          <h2 id="major-title">Weather in Pakistan</h2>
          <CityCards cities={majors} now={now} units={units} />
        </section>
      </WeatherPage>
    );
  }

  const [nation, air] = await Promise.all([loadNation(), loadNationAir()]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(homeSchema()) }} />
      <Shell sky={nationSky(nation)} units={units} unitPath="/">
        <Nation now={nation} air={air} units={units} />
      </Shell>
    </>
  );
}
