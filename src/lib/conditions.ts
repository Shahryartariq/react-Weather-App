import type { Condition, Sky } from "./types";

/**
 * Maps an OpenWeather condition code to our condition groups.
 * Codes: https://openweathermap.org/weather-conditions
 */
export function conditionFromCode(id: number): Condition {
  if (id >= 200 && id < 300) return "thunder";
  if (id >= 300 && id < 400) return "drizzle";
  if (id >= 500 && id < 600) return "rain";
  if (id >= 600 && id < 700) return "snow";
  if (id >= 700 && id < 800) return "mist";
  if (id === 800) return "clear";
  if (id === 801 || id === 802) return "partly";
  return "clouds";
}

const LABELS: Record<Condition, string> = {
  clear: "Clear",
  partly: "Partly cloudy",
  clouds: "Cloudy",
  drizzle: "Drizzle",
  rain: "Rain",
  thunder: "Thunderstorms",
  snow: "Snow",
  mist: "Mist",
};

export function conditionLabel(condition: Condition, isDay = true): string {
  if (condition === "clear" && !isDay) return "Clear night";
  return LABELS[condition];
}

/** OpenWeather descriptions are lower case ("light rain"); make them sentence case. */
export function sentenceCase(text: string): string {
  const trimmed = text.trim();
  return trimmed ? trimmed[0].toUpperCase() + trimmed.slice(1) : trimmed;
}

const TWILIGHT = 40 * 60; // seconds either side of sunrise and sunset

/**
 * Picks the colour of the sky band from the weather and where the sun is.
 * Precipitation wins over time of day; around sunrise and sunset the sky turns warm.
 */
export function skyFor(condition: Condition, now: number, sunrise: number, sunset: number): Sky {
  if (condition === "thunder") return "storm";
  if (condition === "rain" || condition === "drizzle") return "rain";
  if (condition === "snow") return "snow";
  if (Math.abs(now - sunrise) <= TWILIGHT) return "dawn";
  if (Math.abs(now - sunset) <= TWILIGHT) return "dusk";
  if (now < sunrise || now > sunset) return "night";
  if (condition === "mist") return "mist";
  return condition;
}

/** Whether a moment falls between sunrise and sunset. */
export function isDaytime(now: number, sunrise: number, sunset: number): boolean {
  return now >= sunrise && now < sunset;
}
