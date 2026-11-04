import { describe, expect, it } from "vitest";

import { conditionFromCode, conditionLabel, skyFor } from "./conditions";
import sample from "./fixtures/sample.json";
import { compass, dewPoint, formatPressure, formatTemp, formatVisibility, formatWind } from "./format";
import { buildAir, buildDaily, buildHourly, buildSnapshot } from "./forecast";
import { parseLocation, parseUnits, placeHref, placeRegion } from "./query";
import { dayLabel, formatClock, formatHour, formatOffset, localDay } from "./time";
import type { OWAir, OWCurrent, OWForecast } from "./types";

const current = sample.current as OWCurrent;
const forecast = sample.forecast as OWForecast;
const air = sample.air as OWAir;

describe("conditions", () => {
  it.each([
    [211, "thunder"],
    [301, "drizzle"],
    [502, "rain"],
    [601, "snow"],
    [741, "mist"],
    [800, "clear"],
    [801, "partly"],
    [802, "partly"],
    [803, "clouds"],
    [804, "clouds"],
  ])("maps code %i to %s", (code, condition) => {
    expect(conditionFromCode(code)).toBe(condition);
  });

  it("calls a clear night a clear night", () => {
    expect(conditionLabel("clear", false)).toBe("Clear night");
    expect(conditionLabel("clear", true)).toBe("Clear");
  });

  it("picks the sky from weather first, then the sun", () => {
    const sunrise = 1_000_000;
    const sunset = sunrise + 12 * 3600;
    expect(skyFor("rain", sunrise + 3600, sunrise, sunset)).toBe("rain");
    expect(skyFor("thunder", sunset + 3600, sunrise, sunset)).toBe("storm");
    expect(skyFor("clear", sunrise + 600, sunrise, sunset)).toBe("dawn");
    expect(skyFor("clear", sunset - 600, sunrise, sunset)).toBe("dusk");
    expect(skyFor("clear", sunset + 3 * 3600, sunrise, sunset)).toBe("night");
    expect(skyFor("partly", sunrise + 5 * 3600, sunrise, sunset)).toBe("partly");
  });
});

describe("formatting", () => {
  it("converts and rounds temperatures without showing -0", () => {
    expect(formatTemp(24.3, "metric")).toBe("24°");
    expect(formatTemp(24.3, "imperial")).toBe("76°");
    expect(formatTemp(-0.4, "metric")).toBe("0°");
    expect(formatTemp(-17.78, "imperial")).toBe("0°");
    expect(formatTemp(-3.4, "metric")).toBe("−3°");
  });

  it("formats wind, pressure and visibility in both systems", () => {
    expect(formatWind(10, "metric")).toBe("36 km/h");
    expect(formatWind(10, "imperial")).toBe("22 mph");
    expect(formatPressure(1016, "metric")).toBe("1016 hPa");
    expect(formatPressure(1016, "imperial")).toBe("30.00 inHg");
    expect(formatVisibility(10_000, "metric")).toBe("10 km");
    expect(formatVisibility(2_500, "metric")).toBe("2.5 km");
    expect(formatVisibility(10_000, "imperial")).toBe("6.2 mi");
  });

  it("names compass points, wrapping at 360°", () => {
    expect(compass(0)).toBe("N");
    expect(compass(44)).toBe("NE");
    expect(compass(315)).toBe("NW");
    expect(compass(359)).toBe("N");
    expect(compass(-90)).toBe("W");
  });

  it("computes a sensible dew point", () => {
    expect(dewPoint(20, 100)).toBeCloseTo(20, 1);
    expect(dewPoint(24.3, 38)).toBeCloseTo(9.2, 0);
  });
});

describe("time", () => {
  const offset = 18_000; // UTC+5

  it("reads times in the place's own time zone", () => {
    expect(formatClock(current.dt, offset)).toBe("2:30 PM");
    expect(formatHour(current.dt + 3 * 3600, offset)).toBe("5 PM");
    expect(localDay(Date.UTC(2026, 10, 4, 20, 0) / 1000, offset)).toBe("2026-11-05");
  });

  it("labels days relative to today", () => {
    expect(dayLabel("2026-11-04", "2026-11-04")).toBe("Today");
    expect(dayLabel("2026-11-05", "2026-11-04")).toBe("Tomorrow");
    expect(dayLabel("2026-11-06", "2026-11-04")).toBe("Fri");
    expect(dayLabel("2027-01-01", "2026-12-31")).toBe("Tomorrow");
  });

  it("formats UTC offsets, including half hours and negatives", () => {
    expect(formatOffset(18_000)).toBe("UTC+5");
    expect(formatOffset(19_800)).toBe("UTC+5:30");
    expect(formatOffset(-12_600)).toBe("UTC−3:30");
  });
});

describe("forecast", () => {
  it("builds five days starting today, folding the current reading into today's range", () => {
    const days = buildDaily(forecast, current);
    expect(days).toHaveLength(5);
    expect(days[0].date).toBe("2026-11-04");
    expect(days[0].min).toBeLessThanOrEqual(current.main.temp);
    expect(days[0].max).toBeGreaterThanOrEqual(current.main.temp);
    expect(days.map((d) => d.date)).toEqual([...days.map((d) => d.date)].sort());
  });

  it("describes each day by its midday weather, not its night", () => {
    const days = buildDaily(forecast, current);
    expect(days[0].condition).toBe("clear");
    expect(days[2].condition).toBe("partly");
    expect(days[4].condition).toBe("thunder");
    expect(days[4].pop).toBeCloseTo(0.82);
  });

  it("skips a trailing day that has only a few late steps", () => {
    const short: OWForecast = { ...forecast, list: forecast.list.slice(0, 10) };
    const days = buildDaily(short, current);
    expect(days.every((d, i) => i === 0 || d.max - d.min > 0)).toBe(true);
    expect(days.length).toBeLessThanOrEqual(2);
  });

  it("returns the next eight 3-hour steps with day and night flags", () => {
    const hours = buildHourly(forecast, current);
    expect(hours).toHaveLength(8);
    expect(hours[0].time).toBeGreaterThan(current.dt);
    expect(hours[0].isDay).toBe(false); // 5 PM local, after sunset rules from the forecast
    expect(hours.some((h) => h.isDay)).toBe(true);
  });

  it("clamps the air quality index and tolerates missing data", () => {
    expect(buildAir(air)?.index).toBe(3);
    expect(buildAir(null)).toBeUndefined();
    expect(buildAir({ list: [] })).toBeUndefined();
    expect(buildAir({ list: [{ main: { aqi: 9 }, components: { pm2_5: 1, pm10: 1 } }] })?.index).toBe(5);
  });

  it("assembles a full snapshot", () => {
    const snapshot = buildSnapshot({ name: "Islamabad", country: "PK", lat: 33.694, lon: 73.065 }, current, forecast, air);
    expect(snapshot.place.name).toBe("Islamabad");
    expect(snapshot.current.condition).toBe("clear");
    expect(snapshot.current.isDay).toBe(true);
    expect(snapshot.current.description).toBe("Clear sky");
    expect(snapshot.current.high).toBe(snapshot.daily[0].max);
  });
});

describe("query parsing", () => {
  it("accepts valid coordinates and rejects nonsense", () => {
    expect(parseLocation({ lat: "51.5", lon: "-0.12" })).toEqual({ kind: "coords", lat: 51.5, lon: -0.12 });
    expect(parseLocation({ lat: "999", lon: "0" })).toEqual({ kind: "default" });
    expect(parseLocation({ lat: "abc", lon: "1" })).toEqual({ kind: "default" });
    expect(parseLocation({ lat: "", lon: "" })).toEqual({ kind: "default" });
  });

  it("trims and limits search text", () => {
    expect(parseLocation({ q: "  Lahore " })).toEqual({ kind: "search", q: "Lahore" });
    expect(parseLocation({ q: "x" })).toEqual({ kind: "default" });
    expect((parseLocation({ q: "a".repeat(200) }) as { q: string }).q).toHaveLength(80);
  });

  it("defaults to metric and keeps imperial in links", () => {
    expect(parseUnits({})).toBe("metric");
    expect(parseUnits({ units: "imperial" })).toBe("imperial");
    expect(parseUnits({ units: "kelvin" })).toBe("metric");
    expect(placeHref({ lat: 1, lon: 2 }, "imperial")).toBe("/?lat=1&lon=2&units=imperial");
    expect(placeHref({ lat: 1, lon: 2 }, "metric")).toBe("/?lat=1&lon=2");
  });
});

describe("cities and site", async () => {
  const { CITIES, PROVINCES, cityBySlug, cityNear, citiesIn, findCity, nearbyCities, suggestCities } = await import("./cities");
  const { CITY_GUIDES, PROVINCE_GUIDES } = await import("./guides");
  const { isPreviewDeployment, jsonLd, siteUrl } = await import("./site");

  it("has unique slugs that match their names", () => {
    const slugs = CITIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const city of CITIES) expect(city.slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
    expect(cityBySlug("lahore")?.region).toBe("Punjab");
    expect(cityBySlug("atlantis")).toBeUndefined();
  });

  it("covers 50 places, all in Pakistan, each with its own written note", () => {
    expect(CITIES).toHaveLength(50);
    for (const city of CITIES) {
      expect(city.lat, city.slug).toBeGreaterThan(23);
      expect(city.lat, city.slug).toBeLessThan(38);
      expect(city.lon, city.slug).toBeGreaterThan(60);
      expect(city.lon, city.slug).toBeLessThan(78);
      expect(city.nameUr, city.slug).toMatch(/\p{Script=Arabic}/u);
      expect(CITY_GUIDES[city.slug]?.length, city.slug).toBeGreaterThan(80);
    }
    expect(new Set(Object.values(CITY_GUIDES)).size).toBe(CITIES.length);
    expect(Object.keys(CITY_GUIDES)).toHaveLength(CITIES.length);
    for (const province of PROVINCES) {
      expect(PROVINCE_GUIDES[province.slug]).toBeTruthy();
      expect(citiesIn(province.slug).length).toBeGreaterThan(0);
    }
  });

  it("finds cities by name, Urdu name and alias", () => {
    expect(findCity("Lahore")?.slug).toBe("lahore");
    expect(findCity("  lahore, pakistan ")?.slug).toBe("lahore");
    expect(findCity("Lahore, PK")?.slug).toBe("lahore");
    expect(findCity("لاہور")?.slug).toBe("lahore");
    expect(findCity("Pindi")?.slug).toBe("rawalpindi");
    expect(findCity("D.I. Khan")?.slug).toBe("dera-ismail-khan");
    expect(findCity("Mingora")?.slug).toBe("swat");
    expect(findCity("London")).toBeUndefined();
  });

  it("suggests Pakistani cities first, so Hyderabad means Sindh", () => {
    expect(suggestCities("Hyd").map((c) => c.slug)).toEqual(["hyderabad"]);
    expect(suggestCities("mir").map((c) => c.slug)).toEqual(["mirpur-khas", "mirpur"]);
    expect(suggestCities("Lon")).toEqual([]);
    expect(suggestCities("L")).toEqual([]);
  });

  it("lists nearby cities closest first", () => {
    const near = nearbyCities(cityBySlug("islamabad")!, 2);
    expect(near[0].slug).toBe("rawalpindi");
    expect(near).toHaveLength(2);
    expect(near.map((c) => c.slug)).not.toContain("islamabad");
  });

  it("sends searches for listed cities to their own page", () => {
    expect(cityNear(31.5656, 74.3142)?.slug).toBe("lahore");
    expect(cityNear(33.6, 73.05)?.slug).toBe("rawalpindi"); // The closest, not the first within range.
    expect(cityNear(51.5073, -0.1276)).toBeUndefined(); // London
    expect(placeHref({ lat: 31.566, lon: 74.314 }, "metric")).toBe("/weather/lahore");
    expect(placeHref({ lat: 31.566, lon: 74.314 }, "imperial")).toBe("/weather/lahore?units=imperial");
    expect(placeHref({ lat: 51.507, lon: -0.128 }, "metric")).toBe("/?lat=51.507&lon=-0.128");
  });

  it("spells out Pakistan and keeps other country codes", () => {
    expect(placeRegion({ region: "Punjab", country: "PK" })).toBe("Punjab, Pakistan");
    expect(placeRegion({ region: "Ontario", country: "CA" })).toBe("Ontario, CA");
  });

  it("escapes </script> inside structured data", () => {
    expect(jsonLd({ name: "</script><b>" })).not.toContain("</script>");
    expect(JSON.parse(jsonLd({ name: "</script>" })).name).toBe("</script>");
  });

  it("uses the real domain, never the one Vercel guesses", () => {
    const saved = { ...process.env };
    process.env.SITE_URL = "";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "skycast-mu-six.vercel.app";
    expect(siteUrl().toString()).toBe("https://getskycast.vercel.app/");
    process.env.SITE_URL = "https://weather.example.com";
    expect(siteUrl().toString()).toBe("https://weather.example.com/");
    process.env = saved;
  });

  it("keeps preview deployments out of search", () => {
    const saved = { ...process.env };
    process.env.VERCEL_ENV = "preview";
    expect(isPreviewDeployment()).toBe(true);
    process.env.VERCEL_ENV = "production";
    expect(isPreviewDeployment()).toBe(false);
    process.env = saved;
  });
});

describe("air quality", async () => {
  const { aqiBand, usAqi } = await import("./format");

  it.each([
    [0, 0],
    [9, 50],
    [9.1, 51],
    [35.4, 100],
    [35.5, 101],
    [55.4, 150],
    [55.5, 151],
    [125.4, 200],
    [125.5, 201],
    [225.4, 300],
    [225.5, 301],
    [325.4, 500],
    [900, 500],
  ])("turns PM2.5 %d into US AQI %d", (pm25, aqi) => {
    expect(usAqi(pm25)).toBe(aqi);
  });

  it("never leaves a gap between breakpoints", () => {
    // 9.05 sits between the 9.0 and 9.1 breakpoints, and truncates to 9.0.
    expect(usAqi(9.05)).toBe(50);
    expect(usAqi(35.49)).toBe(100);
  });

  it("names each band", () => {
    expect(aqiBand(50).label).toBe("Good");
    expect(aqiBand(51).label).toBe("Moderate");
    expect(aqiBand(150).label).toBe("Unhealthy for sensitive groups");
    expect(aqiBand(200).label).toBe("Unhealthy");
    expect(aqiBand(300).label).toBe("Very unhealthy");
    expect(aqiBand(500).label).toBe("Hazardous");
  });
});

describe("climate", async () => {
  const { CITIES } = await import("./cities");
  const { climateOf, describeMonths, hasRainData, summarise } = await import("./climate");

  it("has twelve sensible months for every city", () => {
    for (const city of CITIES) {
      const climate = climateOf(city.slug);
      expect(climate?.months, city.slug).toHaveLength(12);
      for (const month of climate!.months) {
        expect(month.high, city.slug).toBeGreaterThan(month.low);
        expect(month.rain, city.slug).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("gets the well-known patterns right", () => {
    const lahore = summarise(climateOf("lahore")!);
    expect([4, 5]).toContain(lahore.hottest); // May or June
    expect([11, 0]).toContain(lahore.coldest); // December or January
    expect([6, 7]).toContain(lahore.wettest); // The monsoon
    // Quetta's rain comes mostly in winter, unlike the monsoon cities.
    const quetta = climateOf("quetta")!.months;
    expect(quetta[1].rain).toBeGreaterThan(quetta[6].rain);
  });

  it("hides rainfall where the model is known to overstate it", () => {
    expect(hasRainData("gilgit")).toBe(false);
    expect(hasRainData("lahore")).toBe(true);
  });

  it("describes months in plain words", () => {
    expect(describeMonths([2])).toBe("March");
    expect(describeMonths([2, 3])).toBe("March and April");
    expect(describeMonths([9, 10, 11, 0, 1])).toBe("October to February");
    expect(describeMonths([2, 3, 9, 10])).toBe("March, April, October and November");
    expect(describeMonths([1, 3, 5])).toBe("February, April and June");
    expect(describeMonths([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])).toBe("all year");
    expect(describeMonths([])).toBe("");
  });
});

describe("questions", async () => {
  const { cityBySlug } = await import("./cities");
  const { climateOf } = await import("./climate");
  const { cityFaqs, nationFaqs } = await import("./faq");
  const lahore = cityBySlug("lahore")!;
  const gilgit = cityBySlug("gilgit")!;
  const snapshot = buildSnapshot(lahore, current, forecast, air);

  it("answers from the data on the page", () => {
    const faqs = cityFaqs(lahore, snapshot, climateOf("lahore"), "metric");
    expect(faqs[0].answer).toContain("24°C");
    expect(faqs.map((f) => f.question)).toContain("What is the AQI in Lahore today?");
    expect(faqs.map((f) => f.question)).toContain("Which month gets the most rain in Lahore?");
  });

  it("uses the reader's units", () => {
    expect(cityFaqs(lahore, snapshot, undefined, "imperial")[0].answer).toContain("°F");
  });

  it("never quotes rainfall the model overstates", () => {
    const faqs = cityFaqs(gilgit, { ...snapshot, place: gilgit }, climateOf("gilgit"), "metric");
    expect(JSON.stringify(faqs)).not.toMatch(/wettest| mm/);
  });

  it("says so when no rain is expected", () => {
    const dry = { ...snapshot, daily: snapshot.daily.map((day) => ({ ...day, pop: 0 })) };
    expect(cityFaqs(lahore, dry, undefined, "metric")[1].answer).toMatch(/^No rain is expected/);
  });

  it("names the extremes for the whole country", () => {
    const entry = (slug: string, temp: number, condition: "clear" | "rain") => ({
      city: cityBySlug(slug)!,
      temp,
      condition,
      isDay: true,
      observedAt: 0,
    });
    const nation = [entry("jacobabad", 44, "clear"), entry("skardu", 3, "rain"), entry("lahore", 30, "clear")];
    const faqs = nationFaqs(nation, [{ city: lahore, aqi: 180, pm25: 100 }], "metric");
    expect(faqs[0].answer).toContain("Jacobabad");
    expect(faqs[1].answer).toContain("Skardu");
    expect(faqs[2].answer).toContain("Skardu");
    expect(faqs[3].answer).toContain("Lahore");
    expect(nationFaqs([], [], "metric")).toEqual([]);
  });
});
