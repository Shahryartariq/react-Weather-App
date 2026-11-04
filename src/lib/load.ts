import "server-only";

import { cache } from "react";

import { CITIES, FEATURED } from "./cities";
import { MissingApiKeyError, UpstreamError, getBrief, getSnapshot, placeAt, searchPlaces } from "./openweather";
import { DEFAULT_PLACE, parseLocation } from "./query";
import type { Place, Snapshot } from "./types";

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
    } else place = DEFAULT_PLACE;
    return { kind: "ok", snapshot: await getSnapshot(place) };
  }),
);

/** Weather for a city page. */
export const loadPlace = cache((place: Place) => guard(async () => ({ kind: "ok", snapshot: await getSnapshot(place) })));

export interface WorldEntry {
  slug: string;
  name: string;
  country: string;
  temp: number;
  condition: Snapshot["current"]["condition"];
  isDay: boolean;
}

/** Current temperature in the featured cities. Cities that fail to load are left out. */
export const loadWorld = cache(async (exclude?: string): Promise<WorldEntry[]> => {
  const cities = FEATURED.filter((slug) => slug !== exclude)
    .slice(0, 6)
    .map((slug) => CITIES.find((c) => c.slug === slug)!);
  const results = await Promise.allSettled(cities.map((city) => getBrief(city)));
  return results.flatMap((result, i) =>
    result.status === "fulfilled"
      ? [{ slug: cities[i].slug, name: cities[i].name, country: cities[i].country, ...result.value }]
      : [],
  );
});
