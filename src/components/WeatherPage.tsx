import Link from "next/link";

import { CITIES, cityPath } from "@/lib/cities";
import { skyFor } from "@/lib/conditions";
import { formatTemp } from "@/lib/format";
import type { Outcome, WorldEntry } from "@/lib/load";
import { measurementId } from "@/lib/analytics";
import { usingSampleData } from "@/lib/openweather";
import { SOURCE_URL } from "@/lib/site";
import type { Units } from "@/lib/types";

import { Details } from "./Details";
import { Daily, Hourly } from "./Forecast";
import { Hero } from "./Hero";
import { LocateButton } from "./LocateButton";
import { SearchBox } from "./SearchBox";
import { UnitSwitch } from "./UnitSwitch";
import { WeatherIcon } from "./WeatherIcon";

/**
 * The whole page, shared by the home page and the city pages.
 * Landmarks: header (brand + tools), main (sky, forecast, other cities), footer.
 */
export function WeatherPage({
  outcome,
  units,
  basePath,
  keep,
  world,
  currentSlug,
}: {
  outcome: Outcome;
  units: Units;
  /** Path the °C/°F links point at. */
  basePath: string;
  /** Query parameters the °C/°F links keep (the place on the home page). */
  keep: URLSearchParams;
  world: WorldEntry[];
  currentSlug?: string;
}) {
  const sky =
    outcome.kind === "ok"
      ? skyFor(
          outcome.snapshot.current.condition,
          outcome.snapshot.observedAt,
          outcome.snapshot.current.sunrise,
          outcome.snapshot.current.sunset,
        )
      : "clouds";

  return (
    <div className="page" data-sky={sky}>
      <a className="skip-link" href="#main">
        Skip to the forecast
      </a>
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Skycast home">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="12" cy="13" r="6" className="brand-sun" />
            <path d="M9 24h14a5 5 0 0 0 .6-9.96A6.5 6.5 0 0 0 11.3 16.1 4 4 0 0 0 9 24Z" className="brand-cloud" />
          </svg>
          Skycast
        </Link>
        <div className="tools">
          <SearchBox units={units} />
          <LocateButton units={units} />
          <UnitSwitch units={units} basePath={basePath} params={keep} />
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <div className="sky">
          {outcome.kind === "ok" ? (
            <>
              <Hero snapshot={outcome.snapshot} units={units} />
              <Hourly hours={outcome.snapshot.hourly} offset={outcome.snapshot.timezoneOffset} units={units} />
            </>
          ) : (
            <Notice outcome={outcome} />
          )}
        </div>

        {outcome.kind === "ok" && (
          <div className="almanac">
            <Daily
              days={outcome.snapshot.daily}
              offset={outcome.snapshot.timezoneOffset}
              observedAt={outcome.snapshot.observedAt}
              currentTemp={outcome.snapshot.current.temp}
              units={units}
            />
            <Details snapshot={outcome.snapshot} units={units} />
          </div>
        )}

        <World entries={world} units={units} currentSlug={currentSlug} />
      </main>

      <Footer sample={usingSampleData()} analytics={measurementId() !== null} units={units} />
    </div>
  );
}

function Notice({ outcome }: { outcome: Exclude<Outcome, { kind: "ok" }> }) {
  if (outcome.kind === "not-found") {
    return (
      <section className="notice" aria-labelledby="notice-title">
        <h1 id="notice-title">No place called “{outcome.query}”</h1>
        <p>Check the spelling, or add the country: “Lahore, PK”, “Paris, FR”. You can also use your location.</p>
      </section>
    );
  }
  return (
    <section className="notice" aria-labelledby="notice-title">
      <h1 id="notice-title">Weather data isn&apos;t set up yet</h1>
      {outcome.reason === "missing-key" ? (
        <p>
          This deployment has no <code>OPENWEATHER_API_KEY</code>. Add a free key from OpenWeather to the
          environment and redeploy.
        </p>
      ) : (
        <p>
          OpenWeather rejected the API key. New keys can take up to two hours to start working; otherwise check
          the key in the environment settings.
        </p>
      )}
    </section>
  );
}

/** Other cities right now: a quick way around the site, and internal links for search engines. */
function World({ entries, units, currentSlug }: { entries: WorldEntry[]; units: Units; currentSlug?: string }) {
  const suffix = units === "imperial" ? "?units=imperial" : "";
  const others = CITIES.filter((city) => city.slug !== currentSlug);
  return (
    <section className="world" aria-labelledby="world-title">
      <h2 id="world-title">Around the world</h2>
      {entries.length > 0 && (
        <ul className="world-now">
          {entries.map((entry) => (
            <li key={entry.slug}>
              <Link href={`/weather/${entry.slug}${suffix}`}>
                <span className="world-name">{entry.name}</span>
                <span className="world-country">{entry.country}</span>
                <WeatherIcon condition={entry.condition} isDay={entry.isDay} size={26} />
                <span className="world-temp">{formatTemp(entry.temp, units)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <nav aria-label="Weather by city" className="world-all">
        <span>More cities:</span>
        <ul>
          {others.map((city) => (
            <li key={city.slug}>
              <Link href={`${cityPath(city)}${suffix}`}>{city.name}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}

function Footer({ sample, analytics, units }: { sample: boolean; analytics: boolean; units: Units }) {
  return (
    <footer className="footer">
      <p>
        Weather data from{" "}
        <a href="https://openweathermap.org/" rel="noopener">
          OpenWeather
        </a>
        , refreshed every 10 minutes. Showing {units === "imperial" ? "°F, mph and miles" : "°C, km/h and kilometres"}.
      </p>
      {analytics && (
        <p>Visits are counted with Google Analytics. Locations from “Use my location” are rounded to about 1 km.</p>
      )}
      {sample && <p className="sample-badge">Sample data: set OPENWEATHER_API_KEY for live weather.</p>}
      <p>
        Built by{" "}
        <a href="https://github.com/Shahryartariq" rel="noopener">
          Muhammad Shehryar
        </a>{" "}
        with Next.js and TypeScript ·{" "}
        <a href={SOURCE_URL} rel="noopener">
          Source code
        </a>
      </p>
    </footer>
  );
}
