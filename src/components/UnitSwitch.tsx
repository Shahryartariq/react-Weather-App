import Link from "next/link";

import type { Units } from "@/lib/types";

import { CelsiusLink } from "./CelsiusLink";

/**
 * °C / °F as plain links, so it works before JavaScript loads and the choice is in the URL.
 * The proxy remembers °F in a cookie; the °C link forgets it (see proxy.ts and CelsiusLink).
 */
export function UnitSwitch({
  units,
  basePath,
  params,
}: {
  units: Units;
  basePath: string;
  params: URLSearchParams;
}) {
  const hrefFor = (next: Units | null) => {
    const copy = new URLSearchParams(params);
    if (next) copy.set("units", next);
    else copy.delete("units");
    const query = copy.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <nav className="units" aria-label="Temperature unit">
      <CelsiusLink href={hrefFor("metric")} clean={hrefFor(null)} current={units === "metric"}>
        °C
      </CelsiusLink>
      <Link prefetch={false} href={hrefFor("imperial")} aria-current={units === "imperial" ? "true" : undefined} scroll={false} rel="nofollow">
        °F
      </Link>
    </nav>
  );
}
