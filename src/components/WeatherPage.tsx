import type { ReactNode } from "react";

import { skyFor } from "@/lib/conditions";
import type { Outcome } from "@/lib/load";
import type { Units } from "@/lib/types";

import { Details } from "./Details";
import { Daily, Hourly } from "./Forecast";
import { Hero } from "./Hero";
import { Shell } from "./Shell";

/**
 * A place's forecast, shared by city pages and searches for anywhere else in the world.
 * Landmarks: header (brand + tools), main (sky, forecast, the rest), footer.
 */
export function WeatherPage({
  outcome,
  units,
  basePath,
  keep,
  nameUr,
  crumbs,
  children,
}: {
  outcome: Outcome;
  units: Units;
  /** Path the °C/°F links point at. */
  basePath: string;
  /** Query parameters the °C/°F links keep (the place on a lookup). */
  keep?: URLSearchParams;
  /** The place's name in Urdu, for places we know it. */
  nameUr?: string;
  /** Shown at the top of the sky. */
  crumbs?: ReactNode;
  /** What follows the forecast. */
  children?: ReactNode;
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
    <Shell sky={sky} units={units} unitPath={basePath} keep={keep}>
      <div className="sky">
        {crumbs}
        {outcome.kind === "ok" ? (
          <>
            <Hero snapshot={outcome.snapshot} units={units} nameUr={nameUr} />
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

      {children}
    </Shell>
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
