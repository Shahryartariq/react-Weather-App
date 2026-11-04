import { describe, expect, it } from "vitest";

import { conditionFromCode, conditionLabel, skyFor } from "./conditions";
import sample from "./fixtures/sample.json";
import { compass, dewPoint, formatPressure, formatTemp, formatVisibility, formatWind } from "./format";
import { buildAir, buildDaily, buildHourly, buildSnapshot } from "./forecast";
import { DEFAULT_PLACE, parseLocation, parseUnits, placeHref } from "./query";
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
    const snapshot = buildSnapshot(DEFAULT_PLACE, current, forecast, air);
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
  const { CITIES, cityBySlug, cityNear } = await import("./cities");
  const { jsonLd, siteUrl } = await import("./site");

  it("has unique slugs that match their names", () => {
    const slugs = CITIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const city of CITIES) expect(city.slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
    expect(cityBySlug("london")?.country).toBe("GB");
    expect(cityBySlug("atlantis")).toBeUndefined();
  });

  it("sends searches for listed cities to their own page", () => {
    expect(cityNear(51.5073, -0.1276)?.slug).toBe("london");
    expect(cityNear(42.98, -81.23)).toBeUndefined(); // London, Ontario
    expect(placeHref({ lat: 51.507, lon: -0.128 }, "metric")).toBe("/weather/london");
    expect(placeHref({ lat: 51.507, lon: -0.128 }, "imperial")).toBe("/weather/london?units=imperial");
  });

  it("escapes </script> inside structured data", () => {
    expect(jsonLd({ name: "</script><b>" })).not.toContain("</script>");
    expect(JSON.parse(jsonLd({ name: "</script>" })).name).toBe("</script>");
  });

  it("picks the public URL from SITE_URL, then Vercel, then localhost", () => {
    const saved = { ...process.env };
    process.env.SITE_URL = "";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "skycast.vercel.app";
    expect(siteUrl().toString()).toBe("https://skycast.vercel.app/");
    process.env.SITE_URL = "https://weather.example.com";
    expect(siteUrl().toString()).toBe("https://weather.example.com/");
    process.env.SITE_URL = "";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "";
    expect(siteUrl().toString()).toBe("http://localhost:3000/");
    process.env = saved;
  });
});
