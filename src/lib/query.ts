import type { Place, Units } from "./types";

export const DEFAULT_PLACE: Place = {
  name: "Islamabad",
  region: "Islamabad Capital Territory",
  country: "PK",
  lat: 33.694,
  lon: 73.065,
};

type Params = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export function parseUnits(params: Params): Units {
  return first(params.units) === "imperial" ? "imperial" : "metric";
}

export type LocationQuery =
  | { kind: "default" }
  | { kind: "coords"; lat: number; lon: number }
  | { kind: "search"; q: string };

/** Reads `?lat=&lon=` or `?q=` from the URL, ignoring anything malformed. */
export function parseLocation(params: Params): LocationQuery {
  const lat = Number(first(params.lat));
  const lon = Number(first(params.lon));
  if (
    first(params.lat) &&
    first(params.lon) &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180
  ) {
    return { kind: "coords", lat, lon };
  }
  const q = first(params.q)?.trim().slice(0, 80);
  if (q && q.length >= 2) return { kind: "search", q };
  return { kind: "default" };
}

/** Builds a page URL for a place, keeping the reader's units. */
export function placeHref(place: Pick<Place, "lat" | "lon">, units: Units): string {
  const params = new URLSearchParams({ lat: String(place.lat), lon: String(place.lon) });
  if (units === "imperial") params.set("units", "imperial");
  return `/?${params}`;
}

/** "Lahore, Punjab, PK" without empty parts. */
export function placeLabel(place: Place): string {
  return [place.name, place.region, place.country].filter(Boolean).join(", ");
}
