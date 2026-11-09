import Link from "next/link";

import { cityNear, cityPath } from "@/lib/cities";
import type { Units } from "@/lib/types";
import { formatCoords, visitorLabel, type Visitor } from "@/lib/visitor";

import { CopyButton } from "./CopyButton";
import { LocateButton } from "./LocateButton";

/**
 * What the visitor's connection says about them: IP address, approximate place, and a way to
 * get the exact spot instead. Shown above the weather on /my-location.
 */
export function YourConnection({ visitor, units }: { visitor: Visitor; units: Units }) {
  const where = visitorLabel(visitor);
  const city = visitor.lat !== undefined && visitor.lon !== undefined ? cityNear(visitor.lat, visitor.lon) : undefined;
  const suffix = units === "imperial" ? "?units=imperial" : "";

  return (
    <div className="connection-wrap">
      <section className="connection" aria-labelledby="connection-title">
        <h2 id="connection-title" className="connection-title">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21.5s-6.5-6.2-6.5-11.5a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11.5-6.5 11.5Z" />
            <circle cx="12" cy="10" r="2.4" />
          </svg>
          Your location
        </h2>
        <dl className="connection-facts">
          <div>
            <dt>IP address</dt>
            <dd>
              {visitor.ip ? (
                <>
                  <code className="connection-ip">{visitor.ip}</code>
                  <CopyButton text={visitor.ip} label="Copy IP address" />
                </>
              ) : (
                "Not available"
              )}
            </dd>
          </div>
          <div>
            <dt>Approximate place</dt>
            <dd>{where ?? "Unknown"}</dd>
          </div>
          {visitor.lat !== undefined && visitor.lon !== undefined && (
            <div>
              <dt>Coordinates</dt>
              <dd>{formatCoords(visitor.lat, visitor.lon)}</dd>
            </div>
          )}
          {visitor.timezone && (
            <div>
              <dt>Time zone</dt>
              <dd>{visitor.timezone.replaceAll("_", " ")}</dd>
            </div>
          )}
        </dl>
        <p className="connection-note">
          Found from your internet connection, so it can be off by a few dozen kilometres, and a VPN shows the VPN&apos;s
          location. Nothing here is stored.
        </p>
        <div className="connection-actions">
          <LocateButton units={units} label="Use my exact location" />
          {city && (
            <Link prefetch={false} className="button button-quiet" href={`${cityPath(city)}${suffix}`}>
              Full {city.name} page
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
