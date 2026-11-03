import type { AirQuality, Units } from "./types";

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

const AIR_LABELS = ["Good", "Fair", "Moderate", "Poor", "Very poor"] as const;

export function airLabel(index: AirQuality["index"]): (typeof AIR_LABELS)[number] {
  return AIR_LABELS[index - 1];
}
