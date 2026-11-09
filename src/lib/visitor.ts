import { isIP } from "node:net";

/**
 * Where a visitor's connection comes from, as Vercel's edge network reports it. Vercel looks the
 * IP up itself and adds these headers to every request, replacing any the browser sent, so no
 * third-party lookup service ever sees the address. Off Vercel the headers are simply missing.
 * https://vercel.com/docs/headers/request-headers
 */
export interface Visitor {
  /** The connection's public IP address, or null when it isn't known. */
  ip: string | null;
  /** City name, decoded ("São Paulo"). */
  city?: string;
  /** Two-letter country code ("PK"). */
  country?: string;
  /** IANA time zone ("Asia/Karachi"). */
  timezone?: string;
  /** Rounded to two decimals (about 1 km), the same precision "Use my location" sends. */
  lat?: number;
  lon?: number;
}

const round = (value: number) => Math.round(value * 100) / 100;

function decode(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const text = decodeURIComponent(value).trim();
    // Keep it to something that can only ever be a place name.
    return text && text.length <= 80 && !/[<>\u0000-\u001f]/.test(text) ? text : undefined;
  } catch {
    return undefined;
  }
}

function coordinate(value: string | null, limit: number): number | undefined {
  if (!value?.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit ? round(number) : undefined;
}

/** The first valid address from `x-real-ip`, then the client end of `x-forwarded-for`. */
export function clientIp(headers: Headers): string | null {
  const candidates = [headers.get("x-real-ip"), headers.get("x-forwarded-for")?.split(",")[0]];
  for (const candidate of candidates) {
    const ip = candidate?.trim().replace(/^\[(.*)\]$/, "$1");
    if (ip && isIP(ip)) return ip;
  }
  return null;
}

export function readVisitor(headers: Headers): Visitor {
  const lat = coordinate(headers.get("x-vercel-ip-latitude"), 90);
  const lon = coordinate(headers.get("x-vercel-ip-longitude"), 180);
  const country = headers.get("x-vercel-ip-country")?.trim().toUpperCase();
  const timezone = headers.get("x-vercel-ip-timezone")?.trim();
  return {
    ip: clientIp(headers),
    city: decode(headers.get("x-vercel-ip-city")),
    country: country && /^[A-Z]{2}$/.test(country) ? country : undefined,
    timezone: timezone && /^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/.test(timezone) ? timezone : undefined,
    // Both or neither: half a position is no position.
    ...(lat !== undefined && lon !== undefined ? { lat, lon } : {}),
  };
}

/** Whether there's enough to find the weather: a position, or at least a city. */
export function isLocated(visitor: Visitor): boolean {
  return visitor.lat !== undefined || visitor.city !== undefined;
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** "PK" → "Pakistan". Unknown codes stay as they are. */
export function countryName(code: string | undefined): string | undefined {
  if (!code) return undefined;
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** "Rawalpindi, Pakistan", or whichever part is known. */
export function visitorLabel(visitor: Visitor): string | undefined {
  const parts = [visitor.city, countryName(visitor.country)].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

/** "33.60° N, 73.04° E" */
export function formatCoords(lat: number, lon: number): string {
  const part = (value: number, positive: string, negative: string) =>
    `${Math.abs(value).toFixed(2)}° ${value >= 0 ? positive : negative}`;
  return `${part(lat, "N", "S")}, ${part(lon, "E", "W")}`;
}
