import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";

import { Details } from "@/components/Details";
import { Daily, Hourly } from "@/components/Forecast";
import { Hero } from "@/components/Hero";
import { LocateButton } from "@/components/LocateButton";
import { SearchBox } from "@/components/SearchBox";
import { UnitSwitch } from "@/components/UnitSwitch";
import { conditionLabel, skyFor } from "@/lib/conditions";
import { formatTemp } from "@/lib/format";
import {
  MissingApiKeyError,
  UpstreamError,
  getSnapshot,
  placeAt,
  searchPlaces,
  usingSampleData,
} from "@/lib/openweather";
import { DEFAULT_PLACE, parseLocation, parseUnits, placeLabel } from "@/lib/query";
import type { Place, Snapshot, Units } from "@/lib/types";

type Search = Record<string, string | string[] | undefined>;

type Outcome =
  | { kind: "ok"; snapshot: Snapshot }
  | { kind: "not-found"; query: string }
  | { kind: "setup"; reason: "missing-key" | "rejected-key" };

/** Shared by the page and its metadata; `cache` makes it run once per request. */
const load = cache(async (lat: string, lon: string, q: string): Promise<Outcome> => {
  const location = parseLocation({ lat, lon, q });
  try {
    let place: Place;
    if (location.kind === "coords") place = await placeAt(location.lat, location.lon);
    else if (location.kind === "search") {
      const [match] = await searchPlaces(location.q, 1);
      if (!match) return { kind: "not-found", query: location.q };
      place = match;
    } else place = DEFAULT_PLACE;
    return { kind: "ok", snapshot: await getSnapshot(place) };
  } catch (error) {
    if (error instanceof MissingApiKeyError) return { kind: "setup", reason: "missing-key" };
    if (error instanceof UpstreamError && error.status === 401) return { kind: "setup", reason: "rejected-key" };
    throw error; // Shown by error.tsx with a retry button.
  }
});

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

async function outcomeFor(searchParams: Promise<Search>) {
  const params = await searchParams;
  return { params, outcome: await load(one(params.lat), one(params.lon), one(params.q)) };
}

export async function generateMetadata({ searchParams }: PageProps<"/">): Promise<Metadata> {
  const { params, outcome } = await outcomeFor(searchParams);
  if (outcome.kind !== "ok") return { title: "Skycast" };
  const { place, current } = outcome.snapshot;
  const units = parseUnits(params);
  return {
    title: `${place.name} weather`,
    description: `${formatTemp(current.temp, units)} and ${conditionLabel(current.condition, current.isDay).toLowerCase()} in ${placeLabel(place)}. Hourly and 5-day forecast, wind, humidity and air quality.`,
  };
}

export default async function Page({ searchParams }: PageProps<"/">) {
  const { params, outcome } = await outcomeFor(searchParams);
  const units = parseUnits(params);

  // Links in the unit switch keep the current place.
  const keep = new URLSearchParams();
  for (const name of ["lat", "lon", "q"] as const) {
    const value = one(params[name]);
    if (value) keep.set(name, value);
  }

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
      <div className="sky">
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
            <UnitSwitch units={units} params={keep} />
          </div>
        </header>

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
        <main className="almanac" id="main">
          <Daily
            days={outcome.snapshot.daily}
            offset={outcome.snapshot.timezoneOffset}
            observedAt={outcome.snapshot.observedAt}
            currentTemp={outcome.snapshot.current.temp}
            units={units}
          />
          <Details snapshot={outcome.snapshot} units={units} />
        </main>
      )}

      <Footer sample={usingSampleData()} units={units} />
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

function Footer({ sample, units }: { sample: boolean; units: Units }) {
  return (
    <footer className="footer">
      <p>
        Weather data from{" "}
        <a href="https://openweathermap.org/" rel="noopener">
          OpenWeather
        </a>
        , refreshed every 10 minutes. Showing {units === "imperial" ? "°F, mph and miles" : "°C, km/h and kilometres"}.
      </p>
      {sample && <p className="sample-badge">Sample data: set OPENWEATHER_API_KEY for live weather.</p>}
      <p>
        Built by{" "}
        <a href="https://github.com/Shahryartariq" rel="noopener">
          Muhammad Shehryar
        </a>{" "}
        ·{" "}
        <a href="https://github.com/Shahryartariq/skycast" rel="noopener">
          Source code
        </a>
      </p>
    </footer>
  );
}
