import type { NextRequest } from "next/server";

import { MissingApiKeyError, searchPlaces } from "@/lib/openweather";

/**
 * City suggestions for the search box. The browser calls this route, and this route
 * calls OpenWeather with the key, so the key never reaches the browser.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 80) {
    return Response.json({ error: "Type between 2 and 80 characters." }, { status: 400 });
  }

  try {
    const places = await searchPlaces(q);
    return Response.json(
      { places },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      return Response.json({ error: "Search isn't configured on this server." }, { status: 503 });
    }
    console.error(error);
    return Response.json({ error: "Search is unavailable right now." }, { status: 502 });
  }
}
