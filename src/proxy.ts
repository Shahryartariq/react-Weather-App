import { NextResponse, type NextRequest } from "next/server";

import { measurementId } from "@/lib/analytics";
import { FORMER_CITIES, cityBySlug, cityPath, findCity, provinceBySlug } from "@/lib/cities";
import { buildCsp } from "@/lib/csp";

/**
 * A fresh nonce per request for a strict Content Security Policy: only scripts and
 * styles that Next.js itself rendered with the nonce may run. Pages here are dynamic
 * (they depend on the URL), so nonces cost nothing extra.
 */
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Unknown city and province pages get a real 404 status before any HTML is streamed.
  const city = /^\/weather\/([^/]+)\/?$/.exec(pathname);
  const province = /^\/pakistan\/([^/]+)\/?$/.exec(pathname);

  // Here rather than in next.config: its redirects can't send a query with a space, like "New York".
  const former = city && FORMER_CITIES[city[1]];
  if (former) {
    const target = new URL("/", request.url);
    target.searchParams.set("q", former);
    return NextResponse.redirect(target, 308);
  }

  if (
    (city && !cityBySlug(decodeURIComponent(city[1]))) ||
    (province && !provinceBySlug(decodeURIComponent(province[1])))
  ) {
    return NextResponse.rewrite(new URL("/_unknown-city", request.url));
  }

  // A search for a city we cover goes to its page, so links stay clean and shareable.
  const search = pathname === "/" ? searchParams.get("q") : null;
  const match = search ? findCity(search) : undefined;
  if (match) {
    const target = new URL(cityPath(match), request.url);
    if (searchParams.get("units") === "imperial") target.searchParams.set("units", "imperial");
    return NextResponse.redirect(target);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const csp = buildCsp({ nonce, dev: isDev, analytics: measurementId() !== null });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
