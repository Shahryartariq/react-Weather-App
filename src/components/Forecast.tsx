import { conditionLabel } from "@/lib/conditions";
import { formatPercent, formatTemp, tempColor } from "@/lib/format";
import { dayLabel, formatHour, localDay } from "@/lib/time";
import type { DaySummary, HourSlot, Units } from "@/lib/types";

import { WeatherIcon } from "./WeatherIcon";

/** Rain chance is only worth showing once it's meaningful. */
const showPop = (pop: number) => pop >= 0.2;

export function Hourly({ hours, offset, units }: { hours: HourSlot[]; offset: number; units: Units }) {
  return (
    <section className="hourly" aria-labelledby="hourly-title">
      <h2 id="hourly-title" className="visually-hidden">
        Next 24 hours
      </h2>
      {/* Focusable so keyboard users can scroll it sideways on small screens. */}
      <ol tabIndex={0} aria-label="Next 24 hours">
        {hours.map((hour, index) => (
          <li key={hour.time}>
            <span className="hour-time">{index === 0 ? "Next" : formatHour(hour.time, offset)}</span>
            <WeatherIcon condition={hour.condition} isDay={hour.isDay} size={28} />
            <span className="visually-hidden">{conditionLabel(hour.condition, hour.isDay)}</span>
            <span className="hour-temp">{formatTemp(hour.temp, units)}</span>
            <span className="hour-pop">{showPop(hour.pop) ? formatPercent(hour.pop) : ""}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Daily({
  days,
  offset,
  observedAt,
  currentTemp,
  units,
}: {
  days: DaySummary[];
  offset: number;
  observedAt: number;
  currentTemp: number;
  units: Units;
}) {
  const today = localDay(observedAt, offset);
  const low = Math.min(...days.map((d) => d.min));
  const high = Math.max(...days.map((d) => d.max));
  const span = Math.max(high - low, 1);
  const x = (celsius: number) => ((celsius - low) / span) * 100;

  // Gradient stops placed on the shared scale, so a warm day is visibly warmer.
  const stops = [low, low + span * 0.25, low + span * 0.5, low + span * 0.75, high].map((t, i) => (
    <stop key={i} offset={`${i * 25}%`} stopColor={tempColor(t)} />
  ));

  return (
    <section className="panel daily" aria-labelledby="daily-title">
      <h2 id="daily-title">{days.length}-day forecast</h2>
      <ul>
        {days.map((day) => {
          const label = dayLabel(day.date, today);
          return (
            <li key={day.date}>
              <span className="day-name">{label}</span>
              <span className="day-icon">
                <WeatherIcon condition={day.condition} size={26} />
                <span className="visually-hidden">{conditionLabel(day.condition)}</span>
              </span>
              <span className="day-pop">{showPop(day.pop) ? formatPercent(day.pop) : ""}</span>
              <span className="day-min">
                <span className="visually-hidden">Low </span>
                {formatTemp(day.min, units)}
              </span>
              {/* Percent units instead of a viewBox keep the "now" dot round at any width. */}
              <svg className="day-range" height="10" aria-hidden="true">
                <defs>
                  <linearGradient id={`range-${day.date}`} gradientUnits="userSpaceOnUse" x1="0%" x2="100%" y1="0" y2="0">
                    {stops}
                  </linearGradient>
                </defs>
                <rect className="range-track" x="0" y="3" width="100%" height="4" rx="2" />
                <rect
                  x={`${x(day.min)}%`}
                  y="3"
                  width={`${Math.max(x(day.max) - x(day.min), 3)}%`}
                  height="4"
                  rx="2"
                  fill={`url(#range-${day.date})`}
                />
                {day.date === today && (
                  <circle className="range-now" cx={`${Math.min(Math.max(x(currentTemp), 2), 98)}%`} cy="5" r="3.5" />
                )}
              </svg>
              <span className="day-max">
                <span className="visually-hidden">High </span>
                {formatTemp(day.max, units)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
