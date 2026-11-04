import { NextResponse, type NextRequest } from "next/server";

import { measurementId } from "@/lib/analytics";
import { cityBySlug } from "@/lib/cities";
import { buildCsp } from "@/lib/csp";

/**
 * A fresh nonce per request for a strict Content Security Policy: only scripts and
 * styles that Next.js itself rendered with the nonce may run. Pages here are dynamic
 * (they depend on the URL), so nonces cost nothing extra.
 */
export function proxy(request: NextRequest) {
  // Unknown city pages get a real 404 status before any HTML is streamed.
  const city = /^\/weather\/([^/]+)\/?$/.exec(request.nextUrl.pathname);
  if (city && !cityBySlug(decodeURIComponent(city[1]))) {
    return NextResponse.rewrite(new URL("/_unknown-city", request.url));
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
