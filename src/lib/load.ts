import "server-only";

import { cache } from "react";

import { CITIES, type City } from "./cities";
import { usAqi } from "./format";
import { MissingApiKeyError, UpstreamError, getAir, getBrief, getSnapshot, placeAt, searchPlaces } from "./openweather";
import { parseLocation } from "./query";
import type { Condition, Place, Sky, Snapshot } from "./types";
import type { Visitor } from "./visitor";

export type Outcome =
  | { kind: "ok"; snapshot: Snapshot }
  | { kind: "not-found"; query: string }
  | { kind: "setup"; reason: "missing-key" | "rejected-key" };

async function guard(work: () => Promise<Outcome>): Promise<Outcome> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof MissingApiKeyError) return { kind: "setup", reason: "missing-key" };
    if (error instanceof UpstreamError && error.status === 401) return { kind: "setup", reason: "rejected-key" };
    throw error; // Shown by error.tsx with a retry button.
  }
}

/** Weather for the home page's `?lat=&lon=` or `?q=`. `cache` makes page + metadata share one load. */
export const loadFromQuery = cache((lat: string, lon: string, q: string) =>
  guard(async () => {
    const location = parseLocation({ lat, lon, q });
    let place: Place;
    if (location.kind === "coords") place = await placeAt(location.lat, location.lon);
    else if (location.kind === "search") {
      const [match] = await searchPlaces(location.q, 1);
      if (!match) return { kind: "not-found", query: location.q };
      place = match;
    } else return { kind: "not-found", query: "" };
    return { kind: "ok", snapshot: await getSnapshot(place) };
  }),
);

/**
 * Weather where the visitor's connection comes from: the IP's position if there is one,
 * otherwise a search for its city. "not-found" means the connection gave nothing to go on.
 */
export function loadVisitor(visitor: Visitor): Promise<Outcome> {
  return guard(async () => {
    let place: Place;
    if (visitor.lat !== undefined && visitor.lon !== undefined) {
      place = await placeAt(visitor.lat, visitor.lon);
      // No name from the reverse lookup: the IP's own city is better than "Your location".
      if (!place.country && visitor.city) place = { ...place, name: visitor.city, country: visitor.country ?? "" };
    } else if (visitor.city) {
      const [match] = await searchPlaces(visitor.country ? `${visitor.city}, ${visitor.country}` : visitor.city, 1);
      if (!match) return { kind: "not-found", query: visitor.city };
      place = match;
    } else return { kind: "not-found", query: "" };
    return { kind: "ok", snapshot: await getSnapshot(place) };
  });
}

/** Weather for a city page. */
export const loadPlace = cache((place: Place) => guard(async () => ({ kind: "ok", snapshot: await getSnapshot(place) })));

export interface CityNow {
  city: City;
  temp: number;
  condition: Condition;
  isDay: boolean;
  observedAt: number;
}

/** Current weather in some cities. A city that fails to load is left out, and the page still works. */
export async function loadNow(cities: City[]): Promise<CityNow[]> {
  const results = await Promise.allSettled(cities.map((city) => getBrief(city)));
  return results.flatMap((result, i) => (result.status === "fulfilled" ? [{ city: cities[i], ...result.value }] : []));
}

/** Current weather in every city. */
export const loadNation = cache(() => loadNow(CITIES));

export interface CityAir {
  city: City;
  aqi: number;
  pm25: number;
}

/** Estimated air quality in every city, worst first. */
export const loadNationAir = cache(async (): Promise<CityAir[]> => {
  const results = await Promise.allSettled(CITIES.map((city) => getAir(city)));
  return results
    .flatMap((result, i) =>
      result.status === "fulfilled" && result.value
        ? [{ city: CITIES[i], aqi: usAqi(result.value.pm25), pm25: result.value.pm25 }]
        : [],
    )
    .sort((a, b) => b.pm25 - a.pm25);
});

/** Pages about the whole country take their sky from the capital. */
export function nationSky(nation: CityNow[]): Sky {
  const capital = nation.find((entry) => entry.city.slug === "islamabad");
  if (!capital) return "clear";
  if (capital.condition === "thunder") return "storm";
  if (capital.condition === "rain" || capital.condition === "drizzle") return "rain";
  if (capital.condition === "snow") return "snow";
  return capital.isDay ? capital.condition : "night";
}
