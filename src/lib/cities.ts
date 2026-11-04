import type { Place } from "./types";

export type ProvinceSlug =
  | "punjab"
  | "sindh"
  | "khyber-pakhtunkhwa"
  | "balochistan"
  | "gilgit-baltistan"
  | "azad-kashmir";

export interface Province {
  slug: ProvinceSlug;
  name: string;
  nameUr: string;
}

/** Provinces and regions with their own page. Islamabad has one city, so it links straight to it. */
export const PROVINCES: Province[] = [
  { slug: "punjab", name: "Punjab", nameUr: "پنجاب" },
  { slug: "sindh", name: "Sindh", nameUr: "سندھ" },
  { slug: "khyber-pakhtunkhwa", name: "Khyber Pakhtunkhwa", nameUr: "خیبر پختونخوا" },
  { slug: "balochistan", name: "Balochistan", nameUr: "بلوچستان" },
  { slug: "gilgit-baltistan", name: "Gilgit-Baltistan", nameUr: "گلگت بلتستان" },
  { slug: "azad-kashmir", name: "Azad Kashmir", nameUr: "آزاد کشمیر" },
];

export interface City extends Place {
  slug: string;
  nameUr: string;
  country: "PK";
  /** Missing only for Islamabad, which belongs to no province. */
  province?: ProvinceSlug;
  /** Other names people search for: old names, short forms, the main town of a valley. */
  aliases?: string[];
}

type Row = Omit<City, "country" | "region" | "province"> & { province: ProvinceSlug };

const rows: Row[] = [
  // Punjab
  { slug: "lahore", name: "Lahore", nameUr: "لاہور", province: "punjab", lat: 31.566, lon: 74.314, aliases: ["Lhr"] },
  { slug: "faisalabad", name: "Faisalabad", nameUr: "فیصل آباد", province: "punjab", lat: 31.418, lon: 73.079, aliases: ["Lyallpur", "Fsd"] },
  { slug: "rawalpindi", name: "Rawalpindi", nameUr: "راولپنڈی", province: "punjab", lat: 33.598, lon: 73.044, aliases: ["Pindi", "Rwp"] },
  { slug: "multan", name: "Multan", nameUr: "ملتان", province: "punjab", lat: 30.198, lon: 71.471 },
  { slug: "gujranwala", name: "Gujranwala", nameUr: "گوجرانوالہ", province: "punjab", lat: 32.161, lon: 74.188 },
  { slug: "sialkot", name: "Sialkot", nameUr: "سیالکوٹ", province: "punjab", lat: 32.494, lon: 74.531 },
  { slug: "bahawalpur", name: "Bahawalpur", nameUr: "بہاولپور", province: "punjab", lat: 29.395, lon: 71.683 },
  { slug: "sargodha", name: "Sargodha", nameUr: "سرگودھا", province: "punjab", lat: 32.084, lon: 72.671 },
  { slug: "sahiwal", name: "Sahiwal", nameUr: "ساہیوال", province: "punjab", lat: 30.668, lon: 73.106 },
  { slug: "rahim-yar-khan", name: "Rahim Yar Khan", nameUr: "رحیم یار خان", province: "punjab", lat: 28.42, lon: 70.295, aliases: ["RYK"] },
  { slug: "gujrat", name: "Gujrat", nameUr: "گجرات", province: "punjab", lat: 32.574, lon: 74.079 },
  { slug: "dera-ghazi-khan", name: "Dera Ghazi Khan", nameUr: "ڈیرہ غازی خان", province: "punjab", lat: 30.056, lon: 70.635, aliases: ["DG Khan", "D.G. Khan"] },
  { slug: "sheikhupura", name: "Sheikhupura", nameUr: "شیخوپورہ", province: "punjab", lat: 31.713, lon: 73.978 },
  { slug: "jhang", name: "Jhang", nameUr: "جھنگ", province: "punjab", lat: 31.27, lon: 72.317 },
  { slug: "murree", name: "Murree", nameUr: "مری", province: "punjab", lat: 33.907, lon: 73.394 },
  // Sindh
  { slug: "karachi", name: "Karachi", nameUr: "کراچی", province: "sindh", lat: 24.861, lon: 67.01, aliases: ["Khi"] },
  { slug: "hyderabad", name: "Hyderabad", nameUr: "حیدرآباد", province: "sindh", lat: 25.396, lon: 68.377 },
  { slug: "sukkur", name: "Sukkur", nameUr: "سکھر", province: "sindh", lat: 27.706, lon: 68.857 },
  { slug: "larkana", name: "Larkana", nameUr: "لاڑکانہ", province: "sindh", lat: 27.559, lon: 68.212 },
  { slug: "nawabshah", name: "Nawabshah", nameUr: "نواب شاہ", province: "sindh", lat: 26.248, lon: 68.41, aliases: ["Shaheed Benazirabad", "Benazirabad"] },
  { slug: "mirpur-khas", name: "Mirpur Khas", nameUr: "میرپور خاص", province: "sindh", lat: 25.526, lon: 69.016, aliases: ["Mirpurkhas"] },
  { slug: "jacobabad", name: "Jacobabad", nameUr: "جیکب آباد", province: "sindh", lat: 28.282, lon: 68.438 },
  { slug: "mithi", name: "Mithi", nameUr: "مٹھی", province: "sindh", lat: 24.74, lon: 69.797, aliases: ["Tharparkar", "Thar"] },
  // Khyber Pakhtunkhwa
  { slug: "peshawar", name: "Peshawar", nameUr: "پشاور", province: "khyber-pakhtunkhwa", lat: 34.008, lon: 71.578 },
  { slug: "abbottabad", name: "Abbottabad", nameUr: "ایبٹ آباد", province: "khyber-pakhtunkhwa", lat: 34.149, lon: 73.199 },
  { slug: "mardan", name: "Mardan", nameUr: "مردان", province: "khyber-pakhtunkhwa", lat: 34.198, lon: 72.045 },
  { slug: "swat", name: "Swat", nameUr: "سوات", province: "khyber-pakhtunkhwa", lat: 34.773, lon: 72.36, aliases: ["Mingora", "Saidu Sharif"] },
  { slug: "dera-ismail-khan", name: "Dera Ismail Khan", nameUr: "ڈیرہ اسماعیل خان", province: "khyber-pakhtunkhwa", lat: 31.832, lon: 70.902, aliases: ["DI Khan", "D.I. Khan"] },
  { slug: "kohat", name: "Kohat", nameUr: "کوہاٹ", province: "khyber-pakhtunkhwa", lat: 33.582, lon: 71.441 },
  { slug: "chitral", name: "Chitral", nameUr: "چترال", province: "khyber-pakhtunkhwa", lat: 35.851, lon: 71.786 },
  { slug: "naran", name: "Naran", nameUr: "ناران", province: "khyber-pakhtunkhwa", lat: 34.909, lon: 73.651, aliases: ["Kaghan", "Naran Kaghan"] },
  { slug: "kalam", name: "Kalam", nameUr: "کالام", province: "khyber-pakhtunkhwa", lat: 35.49, lon: 72.58 },
  { slug: "mansehra", name: "Mansehra", nameUr: "مانسہرہ", province: "khyber-pakhtunkhwa", lat: 34.333, lon: 73.197 },
  { slug: "nathia-gali", name: "Nathia Gali", nameUr: "نتھیا گلی", province: "khyber-pakhtunkhwa", lat: 34.073, lon: 73.381, aliases: ["Nathiagali", "Galiyat"] },
  // Balochistan
  { slug: "quetta", name: "Quetta", nameUr: "کوئٹہ", province: "balochistan", lat: 30.184, lon: 67.0 },
  { slug: "gwadar", name: "Gwadar", nameUr: "گوادر", province: "balochistan", lat: 25.126, lon: 62.322 },
  { slug: "turbat", name: "Turbat", nameUr: "تربت", province: "balochistan", lat: 26.003, lon: 63.048, aliases: ["Kech"] },
  { slug: "ziarat", name: "Ziarat", nameUr: "زیارت", province: "balochistan", lat: 30.382, lon: 67.727 },
  { slug: "khuzdar", name: "Khuzdar", nameUr: "خضدار", province: "balochistan", lat: 27.812, lon: 66.611 },
  { slug: "sibi", name: "Sibi", nameUr: "سبی", province: "balochistan", lat: 29.543, lon: 67.877 },
  { slug: "dalbandin", name: "Dalbandin", nameUr: "دالبندین", province: "balochistan", lat: 28.888, lon: 64.406, aliases: ["Chagai"] },
  // Gilgit-Baltistan
  { slug: "gilgit", name: "Gilgit", nameUr: "گلگت", province: "gilgit-baltistan", lat: 35.92, lon: 74.308 },
  { slug: "skardu", name: "Skardu", nameUr: "سکردو", province: "gilgit-baltistan", lat: 35.297, lon: 75.633 },
  { slug: "hunza", name: "Hunza", nameUr: "ہنزہ", province: "gilgit-baltistan", lat: 36.325, lon: 74.666, aliases: ["Karimabad", "Aliabad"] },
  { slug: "astore", name: "Astore", nameUr: "استور", province: "gilgit-baltistan", lat: 35.366, lon: 74.857 },
  // Azad Kashmir
  { slug: "muzaffarabad", name: "Muzaffarabad", nameUr: "مظفرآباد", province: "azad-kashmir", lat: 34.37, lon: 73.471 },
  { slug: "mirpur", name: "Mirpur", nameUr: "میرپور", province: "azad-kashmir", lat: 33.148, lon: 73.752 },
  { slug: "rawalakot", name: "Rawalakot", nameUr: "راولاکوٹ", province: "azad-kashmir", lat: 33.858, lon: 73.76 },
  { slug: "neelum-valley", name: "Neelum Valley", nameUr: "وادی نیلم", province: "azad-kashmir", lat: 34.587, lon: 73.907, aliases: ["Neelum", "Athmuqam", "Keran"] },
];

const provinceName = (slug: ProvinceSlug) => PROVINCES.find((p) => p.slug === slug)!.name;

const ISLAMABAD: City = {
  slug: "islamabad",
  name: "Islamabad",
  nameUr: "اسلام آباد",
  region: "Islamabad Capital Territory",
  country: "PK",
  lat: 33.694,
  lon: 73.065,
  aliases: ["Isb", "Isl"],
};

/** Every city with its own page (/weather/<slug>), listed in the sitemap. */
export const CITIES: City[] = [
  ISLAMABAD,
  ...rows.map((row): City => ({ ...row, country: "PK", region: provinceName(row.province) })),
];

/** World cities that once had their own pages. Their old addresses now run a search. */
export const FORMER_CITIES: Record<string, string> = {
  dubai: "Dubai",
  riyadh: "Riyadh",
  istanbul: "Istanbul",
  london: "London",
  paris: "Paris",
  berlin: "Berlin",
  "new-york": "New York",
  "san-francisco": "San Francisco",
  toronto: "Toronto",
  tokyo: "Tokyo",
  singapore: "Singapore",
  sydney: "Sydney",
};

/** The biggest search targets, in the order they're shown. */
export const MAJOR = ["karachi", "lahore", "islamabad", "rawalpindi", "faisalabad", "multan", "peshawar", "quetta"];

/** Where people go in summer and to see snow. */
export const HILL_STATIONS = ["murree", "nathia-gali", "naran", "swat", "kalam", "hunza", "skardu", "ziarat"];

export function cityBySlug(slug: string): City | undefined {
  return CITIES.find((city) => city.slug === slug);
}

export function provinceBySlug(slug: string): Province | undefined {
  return PROVINCES.find((province) => province.slug === slug);
}

export const citiesIn = (province: ProvinceSlug) => CITIES.filter((city) => city.province === province);

export const cityPath = (city: Pick<City, "slug">) => `/weather/${city.slug}`;
export const provincePath = (province: Pick<Province, "slug">) => `/pakistan/${province.slug}`;

/** Straight-line distance in kilometres. */
export function distanceKm(a: Pick<Place, "lat" | "lon">, b: Pick<Place, "lat" | "lon">): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** The closest listed city within 25 km of a point, so searches land on the city's own page. */
export function cityNear(lat: number, lon: number): City | undefined {
  let best: City | undefined;
  let bestKm = 25;
  for (const city of CITIES) {
    const km = distanceKm(city, { lat, lon });
    if (km < bestKm) {
      best = city;
      bestKm = km;
    }
  }
  return best;
}

/** The listed cities closest to this one, nearest first. */
export function nearbyCities(city: City, count = 6): City[] {
  return CITIES.filter((other) => other.slug !== city.slug)
    .map((other) => ({ other, km: distanceKm(city, other) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, count)
    .map(({ other }) => other);
}

/** "Lahore, PK" and "lahore, pakistan" both mean Lahore. */
function normalise(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/,\s*(pk|pakistan)$/, "")
    .replace(/[.\s-]+/g, " ")
    .trim();
}

const namesOf = (city: City) => [city.name, city.nameUr, city.slug, ...(city.aliases ?? [])].map(normalise);

/** The listed city a search means exactly, by English name, Urdu name or alias. */
export function findCity(query: string): City | undefined {
  const needle = normalise(query);
  return CITIES.find((city) => namesOf(city).includes(needle));
}

/** Listed cities whose names start with what's been typed, so "Hyd" is Hyderabad, Sindh. */
export function suggestCities(query: string, limit = 5): City[] {
  const needle = normalise(query);
  if (needle.length < 2) return [];
  return CITIES.filter((city) => namesOf(city).some((name) => name.startsWith(needle))).slice(0, limit);
}
