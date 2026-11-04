/**
 * Builds src/lib/data/pakistan-outline.json: the SVG paths for the home page map.
 * Source: Natural Earth 1:50m (public domain).
 *
 * The map follows Pakistan's official political map of August 2020 for Jammu and Kashmir and
 * Siachen: Siachen sits inside the outline, and Jammu and Kashmir is a separate disputed area.
 *
 * The output is committed, so the app needs no map library or boundary file.
 *   node scripts/build-map.ts
 */
import { writeFileSync } from "node:fs";

import { CITIES, distanceKm } from "../src/lib/cities.ts";
import { mapX, mapY } from "../src/lib/map.ts";

const SOURCE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson";

type Point = [number, number];

interface Feature {
  properties: Record<string, string>;
  geometry: { type: "Polygon"; coordinates: Point[][] } | { type: "MultiPolygon"; coordinates: Point[][][] };
}

async function features(file: string): Promise<Feature[]> {
  const response = await fetch(`${SOURCE}/${file}`);
  if (!response.ok) throw new Error(`${file}: ${response.status}`);
  return ((await response.json()) as { features: Feature[] }).features;
}

/** The outer ring of each polygon in a feature. */
function rings({ geometry }: Feature): Point[][] {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.map((polygon) => polygon[0]);
}

function find(list: Feature[], name: string, key: string): Feature {
  const match = list.find((feature) => feature.properties[key] === name);
  if (!match) throw new Error(`${name} not found`);
  return match;
}

const countries = await features("ne_50m_admin_0_countries.geojson");
const disputed = await features("ne_50m_admin_0_breakaway_disputed_areas.geojson");

const pakistan = rings(find(countries, "Pakistan", "ADMIN"));
const siachen = rings(find(disputed, "Siachen Glacier", "BRK_NAME"));
const kashmir = rings(find(disputed, "Jammu and Kashmir", "BRK_NAME"));

const inside = ([lon, lat]: Point, points: Point[]) => {
  let result = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) result = !result;
  }
  return result;
};

// Every city should sit inside the outline, or within a few km of the coast or border.
for (const city of CITIES) {
  if (pakistan.some((points) => inside([city.lon, city.lat], points))) continue;
  const km = Math.min(...pakistan.flat().map(([lon, lat]) => distanceKm(city, { lat, lon })));
  console.log(`outside: ${city.slug}, ${km.toFixed(1)} km from the outline`);
}

const number = (value: number) => value.toFixed(1).replace(/\.0$/, "");
const toPath = (list: Point[][]) =>
  list.map((points) => `M${points.map(([lon, lat]) => `${number(mapX(lon))} ${number(mapY(lat))}`).join("L")}Z`).join("");

const output = { path: toPath([...pakistan, ...siachen]), disputed: toPath(kashmir) };
writeFileSync("src/lib/data/pakistan-outline.json", `${JSON.stringify(output)}\n`);

const all = [...pakistan, ...siachen, ...kashmir].flat();
const lons = all.map(([lon]) => lon);
const lats = all.map(([, lat]) => lat);
console.log(`paths ${output.path.length} + ${output.disputed.length} bytes`);
console.log(`lon ${Math.min(...lons).toFixed(2)} to ${Math.max(...lons).toFixed(2)}, lat ${Math.min(...lats).toFixed(2)} to ${Math.max(...lats).toFixed(2)}`);
