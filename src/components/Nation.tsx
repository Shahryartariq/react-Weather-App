import Link from "next/link";

import { CITIES, HILL_STATIONS, MAJOR, PROVINCES, cityBySlug, cityPath, citiesIn, provincePath, type City } from "@/lib/cities";
import type { Faq } from "@/lib/faq";
import { formatTemp, formatTempUnit } from "@/lib/format";
import { SEASONS } from "@/lib/guides";
import type { CityAir, CityNow } from "@/lib/load";
import { formatClock, formatLongDate } from "@/lib/time";
import type { Units } from "@/lib/types";

import { CityCards } from "./Cities";
import { Faqs } from "./CityGuide";
import { PakistanMap } from "./PakistanMap";

const PKT_OFFSET = 5 * 3600;

const bySlugs = (slugs: string[]) => slugs.map((slug) => cityBySlug(slug)!);

function ProvinceList({ title, href, cities, now, units }: { title: string; href: string; cities: City[]; now: CityNow[]; units: Units }) {
  const suffix = units === "imperial" ? "?units=imperial" : "";
  return (
    <div className="panel province-card">
      <h3>
        <Link prefetch={false} href={`${href}${suffix}`}>{title}</Link>
      </h3>
      <ul>
        {cities.map((city) => {
          const entry = now.find((n) => n.city.slug === city.slug);
          return (
            <li key={city.slug}>
              <Link prefetch={false} href={`${cityPath(city)}${suffix}`}>
                <span>{city.name}</span>
                {entry && <span>{formatTemp(entry.temp, units)}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The home page: the whole country at a glance, then every city. */
export function Nation({
  now,
  air,
  faqs,
  units,
}: {
  now: CityNow[];
  air: CityAir[];
  faqs: Faq[];
  units: Units;
}) {
  const suffix = units === "imperial" ? "?units=imperial" : "";
  const sorted = [...now].sort((a, b) => b.temp - a.temp);
  const hottest = sorted[0];
  const coldest = sorted[sorted.length - 1];
  const raining = now.filter((n) => ["rain", "drizzle", "thunder"].includes(n.condition));
  const reading = (slug: string) => now.find((n) => n.city.slug === slug);
  const latest = Math.max(...now.map((n) => n.observedAt), 0);
  const headline = ["karachi", "lahore", "islamabad"].flatMap((slug) => {
    const entry = reading(slug);
    return entry ? [`${formatTempUnit(entry.temp, units)} in ${entry.city.name}`] : [];
  });

  return (
    <>
      <div className="sky sky-flush">
        <section className="nation" aria-labelledby="nation-title">
          <div>
            <h1 id="nation-title">Pakistan weather today</h1>
            <p lang="ur" dir="rtl" className="urdu nation-urdu">
              پاکستان کا موسم آج
            </p>
            <p className="nation-summary">
              {headline.length > 0
                ? `It's ${headline.slice(0, -1).join(", ")} and ${headline[headline.length - 1]} right now. `
                : "Live readings aren't available right now, but every city's page is below. "}
              Live weather, 5-day forecasts and air quality for {CITIES.length} cities, from the Arabian Sea to the
              Karakoram.
            </p>
            {latest > 0 && (
              <p className="nation-time">
                {formatLongDate(latest, PKT_OFFSET)} · Updated <time>{formatClock(latest, PKT_OFFSET)}</time> PKT
              </p>
            )}

            <Link prefetch={false} href={`/my-location${suffix}`} className="button button-icon nation-locate">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21.5s-6.5-6.2-6.5-11.5a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11.5-6.5 11.5Z" />
                <circle cx="12" cy="10" r="2.4" />
              </svg>
              Check weather at my location
            </Link>

            {hottest && (
              <ul className="stats">
                <li>
                  <Link prefetch={false} href={`${cityPath(hottest.city)}${suffix}`}>
                    <span className="stat-label">Hottest now</span>
                    <span className="stat-value">{formatTempUnit(hottest.temp, units)}</span>
                    <span className="stat-place">{hottest.city.name}</span>
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href={`${cityPath(coldest.city)}${suffix}`}>
                    <span className="stat-label">Coldest now</span>
                    <span className="stat-value">{formatTempUnit(coldest.temp, units)}</span>
                    <span className="stat-place">{coldest.city.name}</span>
                  </Link>
                </li>
                <li>
                  {raining[0] ? (
                    <Link prefetch={false} href={`${cityPath(raining[0].city)}${suffix}`}>
                      <span className="stat-label">Raining in</span>
                      <span className="stat-value">
                        {raining.length} {raining.length === 1 ? "city" : "cities"}
                      </span>
                      <span className="stat-place">Including {raining[0].city.name}</span>
                    </Link>
                  ) : (
                    <div>
                      <span className="stat-label">Rain now</span>
                      <span className="stat-value">None</span>
                      <span className="stat-place">In the cities we track</span>
                    </div>
                  )}
                </li>
                {air[0] && (
                  <li>
                    <Link prefetch={false} href="/air-quality">
                      <span className="stat-label">Worst air now</span>
                      <span className="stat-value">AQI {air[0].aqi}</span>
                      <span className="stat-place">{air[0].city.name}</span>
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>
          {now.length > 0 && <PakistanMap nation={now} units={units} />}
        </section>
      </div>

      <section className="section" aria-labelledby="major-title">
        <h2 id="major-title">Major cities</h2>
        <CityCards cities={bySlugs(MAJOR)} now={now} units={units} />
      </section>

      <section className="section" aria-labelledby="hills-title">
        <h2 id="hills-title">Hill stations and northern valleys</h2>
        <CityCards cities={bySlugs(HILL_STATIONS)} now={now} units={units} />
      </section>

      <section className="section" aria-labelledby="provinces-title">
        <h2 id="provinces-title">Weather by province</h2>
        <div className="provinces">
          <ProvinceList title="Islamabad" href="/weather/islamabad" cities={bySlugs(["islamabad"])} now={now} units={units} />
          {PROVINCES.map((province) => (
            <ProvinceList
              key={province.slug}
              title={province.name}
              href={provincePath(province)}
              cities={citiesIn(province.slug)}
              now={now}
              units={units}
            />
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="seasons-title">
        <h2 id="seasons-title">Pakistan&apos;s seasons</h2>
        <dl className="faq">
          {SEASONS.map((season) => (
            <div key={season.name}>
              <dt>
                {season.name}: {season.months}
              </dt>
              <dd>{season.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Faqs faqs={faqs} title="Pakistan weather right now" />
    </>
  );
}
