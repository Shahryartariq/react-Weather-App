import type { Units } from "./types";

/* ---- Unit conversion. Source data is metric. ---- */

export const toFahrenheit = (celsius: number) => (celsius * 9) / 5 + 32;
export const toMph = (metresPerSecond: number) => metresPerSecond * 2.236936;
export const toKmh = (metresPerSecond: number) => metresPerSecond * 3.6;
export const toInHg = (hectopascals: number) => hectopascals * 0.02953;

export function temperature(celsius: number, units: Units): number {
  return Math.round(units === "imperial" ? toFahrenheit(celsius) : celsius);
}

/** "31°" — the unit is shown once, in the switch, not on every number. */
export function formatTemp(celsius: number, units: Units): string {
  // Avoid printing "-0°".
  const value = temperature(celsius, units);
  // A real minus sign (−) reads better than a hyphen at large sizes.
  return value < 0 ? `−${Math.abs(value)}°` : `${value === 0 ? 0 : value}°`;
}

export function formatWind(metresPerSecond: number, units: Units): string {
  return units === "imperial"
    ? `${Math.round(toMph(metresPerSecond))} mph`
    : `${Math.round(toKmh(metresPerSecond))} km/h`;
}

export function formatPressure(hectopascals: number, units: Units): string {
  return units === "imperial" ? `${toInHg(hectopascals).toFixed(2)} inHg` : `${Math.round(hectopascals)} hPa`;
}

export function formatVisibility(metres: number, units: Units): string {
  if (units === "imperial") {
    const miles = metres / 1609.344;
    return `${miles >= 10 ? Math.round(miles) : miles.toFixed(1)} mi`;
  }
  const km = metres / 1000;
  return `${km >= 10 ? Math.round(km) : km.toFixed(1)} km`;
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

/** 0–360° to the nearest of eight compass points. */
export function compass(degrees: number): (typeof COMPASS)[number] {
  const normalised = ((degrees % 360) + 360) % 360;
  return COMPASS[Math.round(normalised / 45) % 8];
}

/** Dew point in °C (Magnus formula), good to about ±0.4 °C in normal conditions. */
export function dewPoint(celsius: number, humidityPercent: number): number {
  const a = 17.62;
  const b = 243.12;
  const gamma = Math.log(Math.max(humidityPercent, 1) / 100) + (a * celsius) / (b + celsius);
  return (b * gamma) / (a - gamma);
}

/** "31°C": for sentences, where the unit switch isn't next to the number. */
export function formatTempUnit(celsius: number, units: Units): string {
  return `${formatTemp(celsius, units)}${units === "imperial" ? "F" : "C"}`;
}

export function formatRain(millimetres: number, units: Units): string {
  return units === "imperial" ? `${(millimetres / 25.4).toFixed(1)} in` : `${Math.round(millimetres)} mm`;
}

/* Temperature scale for bars and map dots, in °C. Tall enough for a Sindh June. */
const TEMP_SCALE: [number, string][] = [
  [-10, "#6E8FE8"],
  [0, "#5FB3E6"],
  [10, "#56C2A8"],
  [18, "#E9C547"],
  [26, "#EE9446"],
  [34, "#E0573F"],
  [42, "#B92B2B"],
];

export function tempColor(celsius: number): string {
  return (TEMP_SCALE.find(([limit]) => celsius <= limit) ?? TEMP_SCALE[TEMP_SCALE.length - 1])[1];
}

/** US EPA PM2.5 breakpoints, as revised in May 2024: [PM2.5 low, PM2.5 high, AQI low, AQI high]. */
const AQI_BREAKPOINTS = [
  [0, 9, 0, 50],
  [9.1, 35.4, 51, 100],
  [35.5, 55.4, 101, 150],
  [55.5, 125.4, 151, 200],
  [125.5, 225.4, 201, 300],
  [225.5, 325.4, 301, 500],
] as const;

/** US AQI from PM2.5, the number people in Pakistan compare. Capped at 500, the top of the scale. */
export function usAqi(pm25: number): number {
  const value = Math.floor(Math.max(pm25, 0) * 10) / 10; // The EPA truncates to one decimal.
  const band = AQI_BREAKPOINTS.find(([, high]) => value <= high);
  if (!band) return 500;
  const [pmLow, pmHigh, aqiLow, aqiHigh] = band;
  return Math.round(((aqiHigh - aqiLow) / (pmHigh - pmLow)) * (value - pmLow) + aqiLow);
}

export interface AqiBand {
  label: string;
  /** 1 (best) to 6 (worst), for the colour dot. */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  advice: string;
}

const AQI_BANDS: (AqiBand & { upTo: number })[] = [
  { upTo: 50, level: 1, label: "Good", advice: "Air quality is fine for everyone." },
  { upTo: 100, level: 2, label: "Moderate", advice: "Fine for most people. Very sensitive people may want to take it easier outdoors." },
  { upTo: 150, level: 3, label: "Unhealthy for sensitive groups", advice: "Children, older people and anyone with asthma or heart disease should cut down on long outdoor effort." },
  { upTo: 200, level: 4, label: "Unhealthy", advice: "Everyone should cut down on long outdoor effort. Sensitive groups should stay indoors where they can." },
  { upTo: 300, level: 5, label: "Very unhealthy", advice: "Avoid long outdoor effort. Keep windows closed, and wear a well-fitted N95 or KN95 mask outside." },
  { upTo: Infinity, level: 6, label: "Hazardous", advice: "Stay indoors with windows closed, and wear a well-fitted N95 or KN95 mask if you must go out." },
];

export function aqiBand(aqi: number): AqiBand {
  return AQI_BANDS.find((band) => aqi <= band.upTo)!;
}
