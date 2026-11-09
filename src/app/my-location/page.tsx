import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { LocateButton } from "@/components/LocateButton";
import { Shell } from "@/components/Shell";
import { WeatherPage } from "@/components/WeatherPage";
import { YourConnection } from "@/components/YourConnection";
import { loadVisitor } from "@/lib/load";
import { parseUnits } from "@/lib/query";
import { pageMeta } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { isLocated, readVisitor } from "@/lib/visitor";

const PATH = "/my-location";

export const metadata: Metadata = pageMeta({
  title: `Weather at My Location: Check Your IP and Local Forecast · ${SITE_NAME}`,
  description:
    "See the weather where you are without typing a city. Skycast finds your approximate location from your IP address and shows the live forecast, hourly and 5-day, with air quality.",
  path: PATH,
});

/**
 * "Weather at my location" without typing and without a permission prompt: the place comes
 * from the visitor's IP, which Vercel's edge looks up for every request. Different for every
 * visitor, so it's never cached (see proxy.ts).
 */
export default async function MyLocationPage({ searchParams }: PageProps<"/my-location">) {
  const units = parseUnits(await searchParams);
  const visitor = readVisitor(await headers());
  const outcome = isLocated(visitor) ? await loadVisitor(visitor) : null;

  if (outcome && outcome.kind !== "not-found") {
    const keep = new URLSearchParams();
    return (
      <WeatherPage outcome={outcome} units={units} basePath={PATH} keep={keep} crumbs={<YourConnection visitor={visitor} units={units} />} />
    );
  }

  return (
    <Shell sky="clouds" units={units}>
      <div className="sky">
        <section className="notice" aria-labelledby="notice-title">
          <h1 id="notice-title">We couldn&apos;t tell where you are</h1>
          <p>
            Your connection didn&apos;t give us a location
            {visitor.ip ? (
              <>
                {" "}
                (your IP address is <code className="connection-ip">{visitor.ip}</code>)
              </>
            ) : null}
            . This happens with some VPNs, private networks and when the site runs on your own computer. Share your exact
            location instead, or search for a city at the top of the page.
          </p>
          <div className="notice-actions">
            <LocateButton units={units} label="Use my exact location" />
            <Link prefetch={false} className="button button-quiet" href={units === "imperial" ? "/?units=imperial" : "/"}>
              All Pakistan weather
            </Link>
          </div>
        </section>
      </div>
    </Shell>
  );
}
