/**
 * Builds src/lib/data/pakistan-outline.json: the SVG path for the home page map.
 * Source: Natural Earth 1:50m (public domain), through the world-atlas package.
 *
 * The output is committed, so the app needs no map library or boundary file.
 *   node scripts/build-map.ts
 */
import { writeFileSync } from "node:fs";

import { CITIES, distanceKm } from "../src/lib/cities.ts";
import { mapX, mapY } from "../src/lib/map.ts";

const SOURCE = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json";

type Point = [number, number];

interface Topology {
  transform: { scale: Point; translate: Point };
  arcs: Point[][];
  objects: {
    countries: {
      geometries: { type: string; arcs: number[][] | number[][][]; properties: { name: string } }[];
    };
  };
}

const topology = (await (await fetch(SOURCE)).json()) as Topology;
const { scale, translate } = topology.transform;

/** TopoJSON stores each arc as offsets from the previous point. */
const decoded = topology.arcs.map((arc) => {
  let x = 0;
  let y = 0;
  return arc.map(([dx, dy]): Point => {
    x += dx;
    y += dy;
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
  });
});

/** Joins arcs into a ring. A negative index means that arc runs backwards. */
function ring(indices: number[]): Point[] {
  const points: Point[] = [];
  for (const index of indices) {
    const arc = index >= 0 ? decoded[index] : [...decoded[~index]].reverse();
    points.push(...(points.length ? arc.slice(1) : arc));
  }
  return points;
}

const pakistan = topology.objects.countries.geometries.find((g) => g.properties.name === "Pakistan");
if (!pakistan) throw new Error("Pakistan not found in the source data");

const polygons = (pakistan.type === "Polygon" ? [pakistan.arcs] : pakistan.arcs) as number[][][];
const rings = polygons.map((polygon) => ring(polygon[0]));

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
const all = rings.flat();
for (const city of CITIES) {
  if (rings.some((points) => inside([city.lon, city.lat], points))) continue;
  const km = Math.min(...all.map(([lon, lat]) => distanceKm(city, { lat, lon })));
  console.log(`outside: ${city.slug}, ${km.toFixed(1)} km from the outline`);
}

const number = (value: number) => value.toFixed(1).replace(/\.0$/, "");
const path = rings
  .map((points) => `M${points.map(([lon, lat]) => `${number(mapX(lon))} ${number(mapY(lat))}`).join("L")}Z`)
  .join("");

writeFileSync("src/lib/data/pakistan-outline.json", `${JSON.stringify({ path })}\n`);
const lons = all.map(([lon]) => lon);
const lats = all.map(([, lat]) => lat);
console.log(`rings ${rings.length}, points ${all.length}, path ${path.length} bytes`);
console.log(`lon ${Math.min(...lons).toFixed(2)} to ${Math.max(...lons).toFixed(2)}, lat ${Math.min(...lats).toFixed(2)} to ${Math.max(...lats).toFixed(2)}`);
