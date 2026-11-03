import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const request = (q: string) => new NextRequest(`http://localhost/api/places?q=${encodeURIComponent(q)}`);

describe("GET /api/places", () => {
  beforeEach(() => {
    vi.stubEnv("WEATHER_SAMPLE_DATA", "");
    vi.stubEnv("OPENWEATHER_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rejects queries that are too short or too long", async () => {
    expect((await GET(request("a"))).status).toBe(400);
    expect((await GET(request("a".repeat(81)))).status).toBe(400);
  });

  it("calls OpenWeather on the server and drops duplicate cities", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json([
        { name: "Lahore", lat: 31.5656, lon: 74.3142, country: "PK", state: "Punjab" },
        { name: "Lahore", lat: 31.5497, lon: 74.3436, country: "PK", state: "Punjab" },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(request("Lahore"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.places).toEqual([{ name: "Lahore", region: "Punjab", country: "PK", lat: 31.566, lon: 74.314 }]);
    const calledUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(calledUrl.pathname).toBe("/geo/1.0/direct");
    expect(calledUrl.searchParams.get("appid")).toBe("test-key");
    // The key goes to OpenWeather only, never back to the browser.
    expect(JSON.stringify(body)).not.toContain("test-key");
    expect(response.headers.get("cache-control")).toContain("s-maxage");
  });

  it("explains a missing key without crashing", async () => {
    vi.stubEnv("OPENWEATHER_API_KEY", "");
    const response = await GET(request("Paris"));
    expect(response.status).toBe(503);
  });

  it("hides upstream errors behind a 502", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 500 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await GET(request("Paris"));
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain("test-key");
  });

  it("serves sample places when sample data is on", async () => {
    vi.stubEnv("WEATHER_SAMPLE_DATA", "1");
    const body = await (await GET(request("Lon"))).json();
    expect(body.places.map((p: { country: string }) => p.country)).toEqual(["GB", "CA"]);
  });
});
