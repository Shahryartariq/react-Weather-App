import "server-only";

import sample from "./fixtures/sample.json";
import { conditionFromCode, isDaytime } from "./conditions";
import { buildSnapshot } from "./forecast";
import type { Condition, OWAir, OWCurrent, OWForecast, OWGeoResult, Place, Snapshot } from "./types";

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
  if (usingSampleData()) return sampleSnapshot(place);
  const coords = { lat: place.lat, lon: place.lon };
  const [current, forecast, air] = await Promise.all([
    get<OWCurrent>("/data/2.5/weather", { ...coords, units: "metric" }, WEATHER_TTL),
    get<OWForecast>("/data/2.5/forecast", { ...coords, units: "metric" }, WEATHER_TTL),
    // Air quality is a nice extra; the page still works without it.
    get<OWAir>("/data/2.5/air_pollution", coords, WEATHER_TTL).catch(() => null),
  ]);
  return buildSnapshot(place, current, forecast, air);
}

export interface Brief {
  temp: number;
  condition: Condition;
  isDay: boolean;
}

/** Just the current temperature and sky, for the "Around the world" strip. One API call. */
export async function getBrief(place: Place): Promise<Brief> {
  if (usingSampleData()) {
    if (Math.abs(place.lat - 33.694) < 0.1 && Math.abs(place.lon - 73.065) < 0.1) {
      return { temp: sample.current.main.temp, condition: "clear", isDay: true };
    }
    // Plausible, stable sample values: cooler further from the equator, varied skies.
    const codes = [800, 801, 803, 500, 800, 802, 804, 800];
    const index = Math.abs(Math.round(place.lat * 7 + place.lon)) % codes.length;
    return {
      temp: Math.round((31 - Math.abs(place.lat) * 0.38 + (index - 3)) * 10) / 10,
      condition: conditionFromCode(codes[index]),
      isDay: (index + Math.round(place.lon / 15)) % 3 !== 0,
    };
  }
  const current = await get<OWCurrent>(
    "/data/2.5/weather",
    { lat: place.lat, lon: place.lon, units: "metric" },
    WEATHER_TTL,
  );
  return {
    temp: current.main.temp,
    condition: conditionFromCode(current.weather[0]?.id ?? 800),
    isDay: isDaytime(current.dt, current.sys.sunrise, current.sys.sunset),
  };
}

const SAMPLE_CODES: Record<Condition, number> = {
  clear: 800, partly: 801, clouds: 804, drizzle: 300, rain: 500, thunder: 211, snow: 600, mist: 741,
};

/**
 * Sample data shaped for each place: the same local clock times as the fixture (afternoon,
 * same sunrise), temperatures and sky matching the "Around the world" strip.
 */
async function sampleSnapshot(place: Place): Promise<Snapshot> {
  // The fixture itself was recorded for Islamabad.
  if (Math.abs(place.lat - 33.694) < 0.1 && Math.abs(place.lon - 73.065) < 0.1) {
    return buildSnapshot(place, sample.current as OWCurrent, sample.forecast as OWForecast, sample.air as OWAir);
  }
  const current = structuredClone(sample.current) as OWCurrent;
  const forecast = structuredClone(sample.forecast) as OWForecast;
  const brief = await getBrief(place);
  const offset = Math.round(place.lon / 15) * 3600;
  const shift = current.timezone - offset; // keeps local wall-clock times the same
  const delta = brief.temp - current.main.temp;

  current.timezone = forecast.city.timezone = offset;
  current.dt += shift;
  current.sys.sunrise += shift;
  current.sys.sunset += shift;
  forecast.city.sunrise = current.sys.sunrise;
  forecast.city.sunset = current.sys.sunset;
  for (const key of ["temp", "feels_like", "temp_min", "temp_max"] as const) current.main[key] += delta;
  current.weather = [{ ...current.weather[0], id: SAMPLE_CODES[brief.condition], description: "" }];
  for (const item of forecast.list) {
    item.dt += shift;
    item.main.temp += delta;
    item.main.temp_min += delta;
    item.main.temp_max += delta;
  }
  return buildSnapshot(place, current, forecast, sample.air as OWAir);
}
