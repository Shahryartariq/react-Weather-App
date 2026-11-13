import Link from "next/link";

import {
  aqiBand,
  compass,
  dewPoint,
  formatPressure,
  formatTemp,
  formatVisibility,
  formatWind,
  usAqi,
} from "@/lib/format";
import { formatClock } from "@/lib/time";
import type { Snapshot, Units } from "@/lib/types";

/** Only worth a note when it really feels different from the thermometer. */
function feelsLikeNote(actual: number, feels: number): string | null {
  const diff = feels - actual;
  if (Math.abs(diff) < 1.5) return null;
  return diff < 0 ? "Wind makes it feel colder" : "Humidity makes it feel warmer";
}

function humidityNote(dew: number, units: Units): string {
  const comfort = dew < 10 ? "Dry" : dew < 16 ? "Comfortable" : dew < 21 ? "A little muggy" : "Humid and sticky";
  return `${comfort}, dew point ${formatTemp(dew, units)}`;
}

/** Below 10 km, say why: in Pakistan that's usually haze, smog or fog. */
function visibilityNote(metres: number): string | null {
  if (metres >= 10_000) return null;
  if (metres >= 4_000) return "Some haze";
  if (metres >= 1_000) return "Poor: haze, smog or rain";
  return "Fog or thick smog";
}

/** Where the sun is between sunrise and sunset, drawn on a simple arc. */
function SunArc({ now, sunrise, sunset }: { now: number; sunrise: number; sunset: number }) {
  const progress = Math.min(Math.max((now - sunrise) / (sunset - sunrise), 0), 1);
  const up = now >= sunrise && now <= sunset;
  // Arc from (8, 44) to (112, 44), peaking at y = 8.
  const angle = Math.PI * (1 - progress);
  const cx = 60 + 52 * Math.cos(angle);
  const cy = 44 - 36 * Math.sin(angle);
  return (
    <svg viewBox="0 0 120 52" className="sun-arc" aria-hidden="true">
      <path className="sun-arc-track" d="M8 44 A52 36 0 0 1 112 44" />
      {up && (
        <path
          className="sun-arc-done"
          d={`M8 44 A52 36 0 0 1 ${cx.toFixed(2)} ${cy.toFixed(2)}`}
        />
      )}
      <line className="sun-arc-horizon" x1="2" y1="44" x2="118" y2="44" />
      {up && <circle className="sun-arc-sun" cx={cx} cy={cy} r="4.5" />}
    </svg>
  );
}

function WindArrow({ degrees }: { degrees: number }) {
  // Meteorological degrees say where wind comes FROM; the arrow points where it goes.
  return (
    <svg viewBox="0 0 24 24" className="wind-arrow" aria-hidden="true">
      <g transform={`rotate(${(degrees + 180) % 360} 12 12)`}>
        <path d="M12 4v15M7 9l5-5 5 5" />
      </g>
    </svg>
  );
}

export function Details({ snapshot, units }: { snapshot: Snapshot; units: Units }) {
  const { current, air, timezoneOffset: offset, observedAt } = snapshot;
  const dew = dewPoint(current.temp, current.humidity);
  const daylightMinutes = Math.round((current.sunset - current.sunrise) / 60);
  const aqi = air && usAqi(air.pm25);
  const band = aqi === undefined ? undefined : aqiBand(aqi);
  const feelsNote = feelsLikeNote(current.temp, current.feelsLike);
  const visNote = visibilityNote(current.visibility);

  return (
    <section className="panel details" aria-labelledby="details-title">
      <h2 id="details-title">Right now</h2>
      <dl>
        <div>
          <dt>Feels like</dt>
          <dd className="detail-value">{formatTemp(current.feelsLike, units)}</dd>
          {feelsNote && <dd className="detail-note">{feelsNote}</dd>}
        </div>
        <div>
          <dt>Wind</dt>
          <dd className="detail-value">
            <WindArrow degrees={current.windDeg} />
            {formatWind(current.windSpeed, units)}
          </dd>
          <dd className="detail-note">
            From the {compass(current.windDeg)}
            {current.windGust ? `, gusts to ${formatWind(current.windGust, units)}` : ""}
          </dd>
        </div>
        <div>
          <dt>Humidity</dt>
          <dd className="detail-value">{current.humidity}%</dd>
          <dd className="detail-note">{humidityNote(dew, units)}</dd>
        </div>
        <div>
          <dt>Air quality</dt>
          {air && band ? (
            <>
              <dd className="detail-value">
                <span className={`aqi aqi-${band.level}`} aria-hidden="true" />
                AQI {aqi}
              </dd>
              <dd className="detail-note">
                {band.label}, PM2.5 {Math.round(air.pm25)} µg/m³.{" "}
                <Link prefetch={false} href="/air-quality">All cities</Link>
              </dd>
            </>
          ) : (
            <dd className="detail-note">Not available here</dd>
          )}
        </div>
        <div>
          <dt>Pressure</dt>
          <dd className="detail-value">{formatPressure(current.pressure, units)}</dd>
        </div>
        <div>
          <dt>Visibility</dt>
          <dd className="detail-value">{formatVisibility(current.visibility, units)}</dd>
          {visNote && <dd className="detail-note">{visNote}</dd>}
        </div>
        <div className="detail-sun">
          <dt>Sunrise and sunset</dt>
          <dd className="detail-sun-arc">
            <SunArc now={observedAt} sunrise={current.sunrise} sunset={current.sunset} />
          </dd>
          <dd className="detail-sun-times">
            <span>
              {formatClock(current.sunrise, offset)} <span>sunrise</span>
            </span>
            <span>
              {formatClock(current.sunset, offset)} <span>sunset</span>
            </span>
          </dd>
          <dd className="detail-note">
            {Math.floor(daylightMinutes / 60)} h {daylightMinutes % 60} min of daylight
          </dd>
        </div>
      </dl>
    </section>
  );
}
