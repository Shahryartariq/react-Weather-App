import "server-only";

import sample from "./fixtures/sample.json";
import { buildSnapshot } from "./forecast";
import type { OWAir, OWCurrent, OWForecast, OWGeoResult, Place, Snapshot } from "./types";

const API = "https://api.openweathermap.org";

/** Weather changes slowly; ten minutes keeps us well inside the free plan's limits. */
const WEATHER_TTL = 600;
/** Place names and coordinates practically never change. */
const GEO_TTL = 60 * 60 * 24 * 7;

export class MissingApiKeyError extends Error {
  constructor() {
    super("OPENWEATHER_API_KEY is not set.");
    this.name = "MissingApiKeyError";
  }
}

export class UpstreamError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

/**
 * Sample data for tests, screenshots and local work without a key.
 * Never on in a Vercel production deployment, whatever the env says.
 */
export function usingSampleData(): boolean {
  return process.env.WEATHER_SAMPLE_DATA === "1" && process.env.VERCEL_ENV !== "production";
}

function apiKey(): string {
  const key = process.env.OPENWEATHER_API_KEY?.trim();
  if (!key) throw new MissingApiKeyError();
  return key;
}

async function get<T>(path: string, params: Record<string, string | number>, ttl: number): Promise<T> {
  const url = new URL(path, API);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, String(value));
  url.searchParams.set("appid", apiKey());

  const response = await fetch(url, {
    next: { revalidate: ttl },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    // Never echo the URL: it contains the key.
    throw new UpstreamError(response.status, `OpenWeather responded with ${response.status} for ${path}`);
  }
  return (await response.json()) as T;
}

/** Rounds coordinates so nearby requests share one cache entry (≈100 m). */
const round = (value: number) => Math.round(value * 1000) / 1000;

function toPlace(result: OWGeoResult): Place {
  return {
    name: result.local_names?.en ?? result.name,
    region: result.state,
    country: result.country,
    lat: round(result.lat),
    lon: round(result.lon),
  };
}

export async function searchPlaces(query: string, limit = 5): Promise<Place[]> {
  if (usingSampleData()) {
    const needle = query.trim().toLowerCase();
    return (sample.places as OWGeoResult[])
      .filter((p) => p.name.toLowerCase().startsWith(needle.split(",")[0].trim()))
      .slice(0, limit)
      .map(toPlace);
  }
  const results = await get<OWGeoResult[]>("/geo/1.0/direct", { q: query, limit }, GEO_TTL);
  // OpenWeather sometimes returns the same city twice with slightly different coordinates.
  const seen = new Set<string>();
  return results.map(toPlace).filter((place) => {
    const key = `${place.name}|${place.region ?? ""}|${place.country}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function placeAt(lat: number, lon: number): Promise<Place> {
  if (usingSampleData()) {
    const match = (sample.places as OWGeoResult[]).find(
      (p) => Math.abs(p.lat - lat) < 0.05 && Math.abs(p.lon - lon) < 0.05,
    );
    return match ? toPlace(match) : { name: "Your location", country: "", lat: round(lat), lon: round(lon) };
  }
  const [result] = await get<OWGeoResult[]>(
    "/geo/1.0/reverse",
    { lat: round(lat), lon: round(lon), limit: 1 },
    GEO_TTL,
  );
  return result ? { ...toPlace(result), lat: round(lat), lon: round(lon) } : {
    name: "Your location",
    country: "",
    lat: round(lat),
    lon: round(lon),
  };
}

export async function getSnapshot(place: Place): Promise<Snapshot> {
  if (usingSampleData()) {
    return buildSnapshot(place, sample.current as OWCurrent, sample.forecast as OWForecast, sample.air as OWAir);
  }
  const coords = { lat: place.lat, lon: place.lon };
  const [current, forecast, air] = await Promise.all([
    get<OWCurrent>("/data/2.5/weather", { ...coords, units: "metric" }, WEATHER_TTL),
    get<OWForecast>("/data/2.5/forecast", { ...coords, units: "metric" }, WEATHER_TTL),
    // Air quality is a nice extra; the page still works without it.
    get<OWAir>("/data/2.5/air_pollution", coords, WEATHER_TTL).catch(() => null),
  ]);
  return buildSnapshot(place, current, forecast, air);
}
