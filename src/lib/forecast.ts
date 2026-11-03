import { conditionFromCode, isDaytime, sentenceCase } from "./conditions";
import { localDay, localHour } from "./time";
import type {
  AirQuality,
  Condition,
  DaySummary,
  HourSlot,
  OWAir,
  OWCurrent,
  OWForecast,
  OWForecastItem,
  Place,
  Snapshot,
} from "./types";

const HOURLY_SLOTS = 8; // eight 3-hour steps = the next 24 hours
const MAX_DAYS = 5;

function conditionOf(item: { weather: { id: number }[] }): Condition {
  return conditionFromCode(item.weather[0]?.id ?? 800);
}

/**
 * Picks the condition that best describes a day: the forecast step closest to
 * local midday, so a clear afternoon isn't labelled by a cloudy 3 AM.
 */
function representativeCondition(items: OWForecastItem[], offset: number): Condition {
  let best = items[0];
  let bestDistance = Infinity;
  for (const item of items) {
    const distance = Math.abs(localHour(item.dt, offset) - 13);
    if (distance < bestDistance) {
      best = item;
      bestDistance = distance;
    }
  }
  return conditionOf(best);
}

export function buildDaily(forecast: OWForecast, current: OWCurrent): DaySummary[] {
  const offset = forecast.city.timezone;
  const today = localDay(current.dt, offset);
  const groups = new Map<string, OWForecastItem[]>();

  for (const item of forecast.list) {
    const day = localDay(item.dt, offset);
    if (day < today) continue;
    const bucket = groups.get(day);
    if (bucket) bucket.push(item);
    else groups.set(day, [item]);
  }

  const days: DaySummary[] = [];
  for (const [date, items] of groups) {
    // A trailing day with only one or two late-night steps would show a misleading range.
    if (date !== today && items.length < 4) continue;
    let min = Math.min(...items.map((i) => i.main.temp_min));
    let max = Math.max(...items.map((i) => i.main.temp_max));
    if (date === today) {
      min = Math.min(min, current.main.temp, current.main.temp_min);
      max = Math.max(max, current.main.temp, current.main.temp_max);
    }
    days.push({
      date,
      min,
      max,
      condition: date === today ? conditionOf(current) : representativeCondition(items, offset),
      pop: Math.max(0, ...items.map((i) => i.pop ?? 0)),
    });
  }

  if (days.length === 0 || days[0].date !== today) {
    days.unshift({
      date: today,
      min: current.main.temp_min,
      max: current.main.temp_max,
      condition: conditionOf(current),
      pop: 0,
    });
  }
  return days.slice(0, MAX_DAYS);
}

export function buildHourly(forecast: OWForecast, current: OWCurrent): HourSlot[] {
  const { sunrise, sunset } = current.sys;
  return forecast.list
    .filter((item) => item.dt > current.dt - 60 * 90)
    .slice(0, HOURLY_SLOTS)
    .map((item) => ({
      time: item.dt,
      temp: item.main.temp,
      condition: conditionOf(item),
      // The forecast's own day/night flag is right for future days too.
      isDay: item.sys?.pod ? item.sys.pod === "d" : isDaytime(item.dt, sunrise, sunset),
      pop: item.pop ?? 0,
    }));
}

export function buildAir(air: OWAir | null): AirQuality | undefined {
  const reading = air?.list[0];
  if (!reading) return undefined;
  const index = Math.min(5, Math.max(1, Math.round(reading.main.aqi))) as AirQuality["index"];
  return { index, pm25: reading.components.pm2_5, pm10: reading.components.pm10 };
}

/** Turns the three raw responses into the single object the page renders. */
export function buildSnapshot(
  place: Place,
  current: OWCurrent,
  forecast: OWForecast,
  air: OWAir | null,
): Snapshot {
  const daily = buildDaily(forecast, current);
  const today = daily[0];
  const { sunrise, sunset } = current.sys;

  return {
    place,
    timezoneOffset: current.timezone,
    observedAt: current.dt,
    current: {
      temp: current.main.temp,
      feelsLike: current.main.feels_like,
      high: today.max,
      low: today.min,
      condition: conditionOf(current),
      description: sentenceCase(current.weather[0]?.description ?? ""),
      humidity: current.main.humidity,
      pressure: current.main.pressure,
      windSpeed: current.wind.speed,
      windGust: current.wind.gust,
      windDeg: current.wind.deg,
      visibility: current.visibility ?? 10_000,
      clouds: current.clouds.all,
      sunrise,
      sunset,
      isDay: isDaytime(current.dt, sunrise, sunset),
    },
    hourly: buildHourly(forecast, current),
    daily,
    air: buildAir(air),
  };
}
