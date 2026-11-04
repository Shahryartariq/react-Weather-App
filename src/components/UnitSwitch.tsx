import Link from "next/link";

import type { Units } from "@/lib/types";

/** °C / °F as plain links, so it works before JavaScript loads and the choice is in the URL. */
export function UnitSwitch({
  units,
  basePath,
  params,
}: {
  units: Units;
  basePath: string;
  params: URLSearchParams;
}) {
  const hrefFor = (next: Units) => {
    const copy = new URLSearchParams(params);
    if (next === "imperial") copy.set("units", "imperial");
    else copy.delete("units");
    const query = copy.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <nav className="units" aria-label="Temperature unit">
      <Link href={hrefFor("metric")} aria-current={units === "metric" ? "true" : undefined} scroll={false} rel="nofollow">
        °C
      </Link>
      <Link href={hrefFor("imperial")} aria-current={units === "imperial" ? "true" : undefined} scroll={false} rel="nofollow">
        °F
      </Link>
    </nav>
  );
}
