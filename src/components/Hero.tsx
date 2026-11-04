import { conditionLabel } from "@/lib/conditions";
import { formatTemp } from "@/lib/format";
import { placeRegion } from "@/lib/query";
import { formatClock, formatLongDate, formatOffset } from "@/lib/time";
import type { Snapshot, Units } from "@/lib/types";

import { WeatherIcon } from "./WeatherIcon";

export function Hero({ snapshot, units, nameUr }: { snapshot: Snapshot; units: Units; nameUr?: string }) {
  const { place, current, timezoneOffset: offset, observedAt } = snapshot;
  const where = placeRegion(place);
  const label = conditionLabel(current.condition, current.isDay);

  return (
    <section className="hero" aria-labelledby="place-name">
      <div className="hero-place">
        <h1 id="place-name">{place.name} weather</h1>
        {where && (
          <p className="hero-where">
            {where}
            {nameUr && (
              <span lang="ur" dir="rtl" className="urdu">
                {nameUr} کا موسم
              </span>
            )}
          </p>
        )}
        <p className="hero-time">
          {formatLongDate(observedAt, offset)} · <time>{formatClock(observedAt, offset)}</time>{" "}
          <span className="hero-offset">{place.country === "PK" ? "PKT" : formatOffset(offset)}</span>
        </p>
      </div>

      <div className="hero-reading">
        <p className="hero-temp" aria-label={`${formatTemp(current.temp, units)} ${units === "imperial" ? "Fahrenheit" : "Celsius"}`}>
          {formatTemp(current.temp, units)}
        </p>
        <div className="hero-summary">
          <p className="hero-condition">
            <WeatherIcon condition={current.condition} isDay={current.isDay} size={30} />
            {current.description && current.description.toLowerCase() !== label.toLowerCase()
              ? current.description
              : label}
          </p>
          <p className="hero-range">
            <span>H {formatTemp(current.high, units)}</span>
            <span>L {formatTemp(current.low, units)}</span>
            <span>Feels {formatTemp(current.feelsLike, units)}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
