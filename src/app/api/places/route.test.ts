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
        { name: "Delhi", lat: 28.6517, lon: 77.2219, country: "IN", state: "Delhi" },
        { name: "Delhi", lat: 28.6139, lon: 77.209, country: "IN", state: "Delhi" },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(request("Delhi"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.places).toEqual([{ name: "Delhi", region: "Delhi", country: "IN", lat: 28.652, lon: 77.222 }]);
    const calledUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(calledUrl.pathname).toBe("/geo/1.0/direct");
    expect(calledUrl.searchParams.get("appid")).toBe("test-key");
    // The key goes to OpenWeather only, never back to the browser.
    expect(JSON.stringify(body)).not.toContain("test-key");
    expect(response.headers.get("cache-control")).toContain("s-maxage");
  });

  it("answers for Pakistani cities without calling OpenWeather", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const body = await (await GET(request("Hyderabad"))).json();
    expect(body.places).toEqual([{ name: "Hyderabad", region: "Sindh", country: "PK", lat: 25.396, lon: 68.377 }]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("finds cities typed in Urdu", async () => {
    const body = await (await GET(request("کراچی"))).json();
    expect(body.places[0].name).toBe("Karachi");
  });

  it("lists Pakistan first when OpenWeather has matches abroad too", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json([
          { name: "Bannu", lat: 10, lon: 10, country: "NG" },
          { name: "Bannu", lat: 32.986, lon: 70.604, country: "PK", state: "Khyber Pakhtunkhwa" },
        ]),
      ),
    );
    const body = await (await GET(request("Bannu"))).json();
    expect(body.places.map((p: { country: string }) => p.country)).toEqual(["PK", "NG"]);
  });

  it("retries once when rate limited, then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("slow down", { status: 429 }))
      .mockResolvedValueOnce(Response.json([{ name: "Bannu", lat: 32.986, lon: 70.604, country: "PK" }]));
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(request("Bannu"));
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("doesn't retry a rejected key", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("nope", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await GET(request("Bannu"))).status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
