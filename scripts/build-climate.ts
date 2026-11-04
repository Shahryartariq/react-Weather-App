/**
 * Builds src/lib/data/climate.json: ten years of daily weather per city, reduced to monthly averages.
 * Source: Open-Meteo Historical Weather API (ERA5 reanalysis, CC BY 4.0).
 *
 * The output is committed, so the app never calls this API. Rerun once a year:
 *   node scripts/build-climate.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { CITIES } from "../src/lib/cities.ts";

const FIRST_YEAR = 2016;
const LAST_YEAR = 2025;
const YEARS = LAST_YEAR - FIRST_YEAR + 1;
/** A day counts as wet from 1 mm, the usual definition of a "rain day". */
const WET_DAY_MM = 1;

interface Archive {
  elevation: number;
  daily: {
    time: string[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    precipitation_sum: (number | null)[];
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const round = (value: number) => Math.round(value * 10) / 10;

async function fetchArchive(lat: number, lon: number): Promise<Archive> {
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.search = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    start_date: `${FIRST_YEAR}-01-01`,
    end_date: `${LAST_YEAR}-12-31`,
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
    timezone: "Asia/Karachi",
  }).toString();

  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url);
    if (response.ok) return (await response.json()) as Archive;
    if (attempt === 5) throw new Error(`Open-Meteo responded with ${response.status}`);
    await sleep(attempt * 20_000); // Rate limited: wait and try again.
  }
}

function monthlyAverages({ daily }: Archive) {
  const months = Array.from({ length: 12 }, () => ({ high: 0, low: 0, days: 0, rain: 0, wet: 0 }));
  daily.time.forEach((date, i) => {
    const high = daily.temperature_2m_max[i];
    const low = daily.temperature_2m_min[i];
    const rain = daily.precipitation_sum[i];
    if (high === null || low === null || rain === null) return;
    const month = months[Number(date.slice(5, 7)) - 1];
    month.high += high;
    month.low += low;
    month.days += 1;
    month.rain += rain;
    if (rain >= WET_DAY_MM) month.wet += 1;
  });
  return months.map((m) => ({
    high: round(m.high / m.days),
    low: round(m.low / m.days),
    rain: Math.round(m.rain / YEARS),
    rainDays: round(m.wet / YEARS),
  }));
}

const cities: Record<string, unknown> = {};
for (const city of CITIES) {
  const archive = await fetchArchive(city.lat, city.lon);
  cities[city.slug] = { elevation: Math.round(archive.elevation), months: monthlyAverages(archive) };
  console.log(city.slug);
  await sleep(1500);
}

mkdirSync("src/lib/data", { recursive: true });
writeFileSync(
  "src/lib/data/climate.json",
  `${JSON.stringify({ period: `${FIRST_YEAR}–${LAST_YEAR}`, cities })}\n`,
);
