/** Compares each city's coordinates with an independent geocoder. Run: node scripts/check-cities.ts */
import { CITIES, distanceKm } from "../src/lib/cities.ts";

const lookupName: Record<string, string> = { swat: "Mingora", hunza: "Karimabad", "neelum-valley": "Athmuqam" };

interface Hit {
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  admin1?: string;
}

for (const city of CITIES) {
  const name = lookupName[city.slug] ?? city.name;
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&countryCode=PK`;
  const { results = [] } = (await (await fetch(url)).json()) as { results?: Hit[] };
  const best = results
    .map((hit) => ({ ...hit, km: distanceKm(city, { lat: hit.latitude, lon: hit.longitude }) }))
    .sort((a, b) => a.km - b.km)[0];
  const flag = !best ? "NOT FOUND" : best.km > 10 ? "CHECK" : "ok";
  const detail = best ? `${best.km.toFixed(1)} km, ${best.name}, ${best.admin1}, ${best.elevation} m` : "";
  console.log(`${flag.padEnd(10)}${city.slug.padEnd(20)}${detail}`);
}
