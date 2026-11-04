import "server-only";

import sample from "./fixtures/sample.json";
import { suggestCities } from "./cities";
import { conditionFromCode, isDaytime } from "./conditions";
import { buildAir, buildSnapshot } from "./forecast";
import type { AirQuality, Condition, OWAir, OWCurrent, OWForecast, OWGeoResult, Place, Snapshot } from "./types";

const API = "https://api.openweathermap.org";

/**
 * Each lifetime matches how often the source really changes. With every city kept warm that's
 * about 7.5 calls a minute, a third of the free plan's 1,000,000 calls a month.
 */
const CURRENT_TTL = 600;
/** The forecast comes in 3-hour steps. */
const FORECAST_TTL = 1800;
/** Air quality is an hourly model. */
const AIR_TTL = 3600;
/** Place names and coordinates practically never change. */
const GEO_TTL = 60 * 60 * 24 * 7;

/** One retry rides out a rate-limit blip or a dropped connection without failing the page. */
const ATTEMPTS = 2;
const RETRY_DELAY_MS = 400;

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

  for (let attempt = 1; ; attempt++) {
    let failure: UpstreamError;
    try {
      const response = await fetch(url, {
        next: { revalidate: ttl },
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) return (await response.json()) as T;
      // Never echo the URL: it contains the key.
      failure = new UpstreamError(response.status, `OpenWeather responded with ${response.status} for ${path}`);
      if (response.status !== 429 && response.status < 500) throw failure;
    } catch (error) {
      if (error instanceof UpstreamError) throw error;
      failure = new UpstreamError(503, `OpenWeather didn't answer for ${path}`);
    }
    if (attempt === ATTEMPTS) throw failure;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }
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
  // Our own cities first: instant, free, and "Hyderabad" means Sindh rather than India.
  const listed = suggestCities(query, limit);
  if (listed.length > 0) {
    return listed.map(({ name, region, country, lat, lon }) => ({ name, region, country, lat, lon }));
  }
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
  const places = results.map(toPlace).filter((place) => {
    const key = `${place.name}|${place.region ?? ""}|${place.country}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...places.filter((p) => p.country === "PK"), ...places.filter((p) => p.country !== "PK")];
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
    get<OWCurrent>("/data/2.5/weather", { ...coords, units: "metric" }, CURRENT_TTL),
    get<OWForecast>("/data/2.5/forecast", { ...coords, units: "metric" }, FORECAST_TTL),
    // Air quality is a nice extra; the page still works without it.
    get<OWAir>("/data/2.5/air_pollution", coords, AIR_TTL).catch(() => null),
  ]);
  return buildSnapshot(place, current, forecast, air);
}

export interface Brief {
  temp: number;
  condition: Condition;
  isDay: boolean;
  /** When the reading was taken, in Unix seconds. */
  observedAt: number;
}

/** Air quality alone, for the ranking of cities. Shares its cache entry with the city page. */
export async function getAir(place: Place): Promise<AirQuality | undefined> {
  if (usingSampleData()) return sampleAir(place);
  return buildAir(await get<OWAir>("/data/2.5/air_pollution", { lat: place.lat, lon: place.lon }, AIR_TTL));
}

/** Plausible, stable sample values that differ from city to city. */
function sampleAir(place: Place): AirQuality {
  const pm25 = Math.round((8 + (Math.abs(place.lat * 37 + place.lon * 11) % 170)) * 10) / 10;
  const index = (pm25 < 10 ? 1 : pm25 < 25 ? 2 : pm25 < 50 ? 3 : pm25 < 75 ? 4 : 5) as AirQuality["index"];
  return { index, pm25, pm10: Math.round(pm25 * 1.7) };
}

/** Just the current temperature and sky, for lists of cities. One API call, shared with the city page. */
export async function getBrief(place: Place): Promise<Brief> {
  if (usingSampleData()) {
    if (Math.abs(place.lat - 33.694) < 0.1 && Math.abs(place.lon - 73.065) < 0.1) {
      return { temp: sample.current.main.temp, condition: "clear", isDay: true, observedAt: sample.current.dt };
    }
    // Plausible, stable sample values: cooler further from the equator, varied skies.
    const codes = [800, 801, 803, 500, 800, 802, 804, 800];
    const index = Math.abs(Math.round(place.lat * 7 + place.lon)) % codes.length;
    return {
      temp: Math.round((31 - Math.abs(place.lat) * 0.38 + (index - 3)) * 10) / 10,
      condition: conditionFromCode(codes[index]),
      isDay: (index + Math.round(place.lon / 15)) % 3 !== 0,
      observedAt: sample.current.dt,
    };
  }
  const current = await get<OWCurrent>(
    "/data/2.5/weather",
    { lat: place.lat, lon: place.lon, units: "metric" },
    CURRENT_TTL,
  );
  return {
    temp: current.main.temp,
    condition: conditionFromCode(current.weather[0]?.id ?? 800),
    isDay: isDaytime(current.dt, current.sys.sunrise, current.sys.sunset),
    observedAt: current.dt,
  };
}

const SAMPLE_CODES: Record<Condition, number> = {
  clear: 800, partly: 801, clouds: 804, drizzle: 300, rain: 500, thunder: 211, snow: 600, mist: 741,
};

/**
 * Sample data shaped for each place: the same local clock times as the fixture (afternoon,
 * same sunrise), temperatures and sky matching the lists of cities.
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
