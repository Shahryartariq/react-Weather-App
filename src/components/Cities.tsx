import Link from "next/link";

import { cityPath, type City } from "@/lib/cities";
import { conditionLabel } from "@/lib/conditions";
import { formatTemp } from "@/lib/format";
import type { CityNow } from "@/lib/load";
import type { Units } from "@/lib/types";

import { WeatherIcon } from "./WeatherIcon";

/**
 * City cards with the temperature right now. A city whose reading failed to load
 * still gets its card and link, so a bad minute upstream doesn't remove pages from the site.
 */
export function CityCards({ cities, now, units }: { cities: City[]; now: CityNow[]; units: Units }) {
  const suffix = units === "imperial" ? "?units=imperial" : "";
  return (
    <ul className="city-grid">
      {cities.map((city) => {
        const entry = now.find((n) => n.city.slug === city.slug);
        return (
          <li key={city.slug}>
            <Link prefetch={false} href={`${cityPath(city)}${suffix}`}>
              <span className="city-name">{city.name}</span>
              <span className="city-region">{entry ? conditionLabel(entry.condition, entry.isDay) : city.region}</span>
              {entry && <WeatherIcon condition={entry.condition} isDay={entry.isDay} size={26} />}
              {entry && <span className="city-temp">{formatTemp(entry.temp, units)}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
