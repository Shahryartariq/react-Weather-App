import { describe, expect, it } from "vitest";

import { clientIp, countryName, formatCoords, isLocated, readVisitor, visitorLabel } from "./visitor";

const vercel = (extra: Record<string, string> = {}) =>
  new Headers({
    "x-real-ip": "39.45.120.7",
    "x-forwarded-for": "39.45.120.7",
    "x-vercel-ip-city": "Rawalpindi",
    "x-vercel-ip-country": "PK",
    "x-vercel-ip-country-region": "PB",
    "x-vercel-ip-timezone": "Asia/Karachi",
    "x-vercel-ip-latitude": "33.5973",
    "x-vercel-ip-longitude": "73.0479",
    ...extra,
  });

describe("visitor", () => {
  it("reads what Vercel's edge adds to the request", () => {
    expect(readVisitor(vercel())).toEqual({
      ip: "39.45.120.7",
      city: "Rawalpindi",
      country: "PK",
      timezone: "Asia/Karachi",
      lat: 33.6,
      lon: 73.05,
    });
  });

  it("decodes city names", () => {
    expect(readVisitor(vercel({ "x-vercel-ip-city": "S%C3%A3o%20Paulo" })).city).toBe("São Paulo");
    expect(readVisitor(vercel({ "x-vercel-ip-city": "%E0%A4%A" })).city).toBeUndefined();
    expect(readVisitor(vercel({ "x-vercel-ip-city": "%3Cscript%3E" })).city).toBeUndefined();
  });

  it("needs both coordinates, in range", () => {
    const noLon = readVisitor(vercel({ "x-vercel-ip-longitude": "" }));
    expect(noLon.lat).toBeUndefined();
    expect(noLon.lon).toBeUndefined();
    expect(readVisitor(vercel({ "x-vercel-ip-latitude": "91" })).lat).toBeUndefined();
    expect(readVisitor(vercel({ "x-vercel-ip-latitude": "abc" })).lat).toBeUndefined();
    expect(readVisitor(vercel({ "x-vercel-ip-latitude": "-33.868", "x-vercel-ip-longitude": "151.21" }))).toMatchObject({
      lat: -33.87,
      lon: 151.21,
    });
  });

  it("drops malformed country codes and time zones", () => {
    const visitor = readVisitor(vercel({ "x-vercel-ip-country": "Pakistan", "x-vercel-ip-timezone": "<b>" }));
    expect(visitor.country).toBeUndefined();
    expect(visitor.timezone).toBeUndefined();
    expect(readVisitor(vercel({ "x-vercel-ip-timezone": "America/Argentina/Buenos_Aires" })).timezone).toBe(
      "America/Argentina/Buenos_Aires",
    );
  });

  it("finds the client's IP address", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "2001:db8::1, 10.0.0.1" }))).toBe("2001:db8::1");
    expect(clientIp(new Headers({ "x-real-ip": "[2001:db8::2]" }))).toBe("2001:db8::2");
    expect(clientIp(new Headers({ "x-real-ip": "not an ip", "x-forwarded-for": "203.0.113.9" }))).toBe("203.0.113.9");
    expect(clientIp(new Headers())).toBeNull();
  });

  it("knows whether there's anything to go on", () => {
    expect(isLocated(readVisitor(vercel()))).toBe(true);
    expect(isLocated(readVisitor(new Headers({ "x-vercel-ip-city": "Lahore" })))).toBe(true);
    expect(isLocated(readVisitor(new Headers({ "x-real-ip": "203.0.113.9" })))).toBe(false);
  });

  it("labels places and coordinates for people", () => {
    expect(countryName("PK")).toBe("Pakistan");
    expect(visitorLabel(readVisitor(vercel()))).toBe("Rawalpindi, Pakistan");
    expect(visitorLabel(readVisitor(new Headers({ "x-vercel-ip-country": "GB" })))).toBe("United Kingdom");
    expect(visitorLabel(readVisitor(new Headers()))).toBeUndefined();
    expect(formatCoords(33.6, 73.05)).toBe("33.60° N, 73.05° E");
    expect(formatCoords(-33.87, -70.65)).toBe("33.87° S, 70.65° W");
  });
});
