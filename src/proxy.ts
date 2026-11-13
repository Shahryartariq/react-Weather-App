import { NextResponse, type NextRequest } from "next/server";

import { measurementId } from "@/lib/analytics";
import { FORMER_CITIES, cityBySlug, cityPath, findCity, provinceBySlug } from "@/lib/cities";
import { buildCsp } from "@/lib/csp";
import { UNITS_COOKIE, UNITS_MAX_AGE } from "@/lib/units";

/**
 * A fresh nonce per request for a strict Content Security Policy: only scripts and
 * styles that Next.js itself rendered with the nonce may run. Pages here are dynamic
 * (they depend on the URL), so nonces cost nothing extra.
 */
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Typed or old links with capitals ("/weather/Lahore") go to the real page.
  if (/^\/(weather|pakistan)\//i.test(pathname) && pathname !== pathname.toLowerCase()) {
    const target = request.nextUrl.clone();
    target.pathname = pathname.toLowerCase();
    return NextResponse.redirect(target, 308);
  }

  // °C is the default, so choosing it clears the saved choice and drops the parameter.
  const unitsParam = searchParams.get("units");
  if (unitsParam === "metric") {
    const target = request.nextUrl.clone();
    target.searchParams.delete("units");
    const response = NextResponse.redirect(target);
    response.cookies.delete(UNITS_COOKIE);
    return response;
  }

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

  // Someone who picked °F keeps it on their next visit: the page reads it from the URL as usual.
  const remembered = !unitsParam && request.cookies.get(UNITS_COOKIE)?.value === "imperial";
  let response: NextResponse;
  if (remembered) {
    const target = request.nextUrl.clone();
    target.searchParams.set("units", "imperial");
    response = NextResponse.rewrite(target, { request: { headers: requestHeaders } });
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }
  if (unitsParam === "imperial") {
    response.cookies.set(UNITS_COOKIE, "imperial", {
      path: "/",
      maxAge: UNITS_MAX_AGE,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  }
  response.headers.set("Content-Security-Policy", csp);
  // Built from the visitor's own IP address, so no shared cache may keep a copy.
  if (pathname === "/my-location") response.headers.set("Cache-Control", "private, no-store, max-age=0");
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
