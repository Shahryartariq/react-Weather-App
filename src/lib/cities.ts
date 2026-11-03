import type { Place } from "./types";

export interface City extends Place {
  slug: string;
}

/** Cities with their own page (/weather/<slug>), listed in the sitemap and linked from every page. */
export const CITIES: City[] = [
  { slug: "islamabad", name: "Islamabad", region: "Islamabad Capital Territory", country: "PK", lat: 33.694, lon: 73.065 },
  { slug: "lahore", name: "Lahore", region: "Punjab", country: "PK", lat: 31.566, lon: 74.314 },
  { slug: "karachi", name: "Karachi", region: "Sindh", country: "PK", lat: 24.861, lon: 67.01 },
  { slug: "peshawar", name: "Peshawar", region: "Khyber Pakhtunkhwa", country: "PK", lat: 34.008, lon: 71.578 },
  { slug: "dubai", name: "Dubai", region: "Dubai", country: "AE", lat: 25.276, lon: 55.296 },
  { slug: "riyadh", name: "Riyadh", region: "Riyadh Region", country: "SA", lat: 24.714, lon: 46.675 },
  { slug: "istanbul", name: "Istanbul", region: "Istanbul", country: "TR", lat: 41.008, lon: 28.978 },
  { slug: "london", name: "London", region: "England", country: "GB", lat: 51.507, lon: -0.128 },
  { slug: "paris", name: "Paris", region: "Île-de-France", country: "FR", lat: 48.857, lon: 2.352 },
  { slug: "berlin", name: "Berlin", region: "Berlin", country: "DE", lat: 52.52, lon: 13.405 },
  { slug: "new-york", name: "New York", region: "New York", country: "US", lat: 40.713, lon: -74.006 },
  { slug: "san-francisco", name: "San Francisco", region: "California", country: "US", lat: 37.775, lon: -122.419 },
  { slug: "toronto", name: "Toronto", region: "Ontario", country: "CA", lat: 43.653, lon: -79.383 },
  { slug: "tokyo", name: "Tokyo", region: "Tokyo", country: "JP", lat: 35.683, lon: 139.759 },
  { slug: "singapore", name: "Singapore", country: "SG", lat: 1.29, lon: 103.852 },
  { slug: "sydney", name: "Sydney", region: "New South Wales", country: "AU", lat: -33.869, lon: 151.209 },
];

/** Shown in the "Around the world" strip: a spread of climates and time zones. */
export const FEATURED = ["islamabad", "london", "new-york", "tokyo", "dubai", "sydney", "paris", "singapore"];

export function cityBySlug(slug: string): City | undefined {
  return CITIES.find((city) => city.slug === slug);
}

/** The listed city within ~25 km of a point, if any, so searches land on the city's own page. */
export function cityNear(lat: number, lon: number): City | undefined {
  return CITIES.find((city) => Math.abs(city.lat - lat) < 0.25 && Math.abs(city.lon - lon) < 0.25);
}

export const cityPath = (city: Pick<City, "slug">) => `/weather/${city.slug}`;
