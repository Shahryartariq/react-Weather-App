import { aqiBand, formatPercent, usAqi } from "./format";
import { dayLabel, localDay } from "./time";
import type { Snapshot } from "./types";

/** Below this, rain isn't worth a mention. Matches what the forecast shows. */
const RAIN_WORTH_MENTIONING = 0.2;

const LONG_DAYS: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

export interface OutlookLine {
  kind: "rain" | "dry" | "air";
  text: string;
}

/**
 * The two things people check a forecast for, in a few words each: when it will rain, and
 * whether the air is safe to be out in. Air is only mentioned once it's a problem.
 */
export function outlook(snapshot: Snapshot): OutlookLine[] {
  const lines: OutlookLine[] = [];
  const today = localDay(snapshot.observedAt, snapshot.timezoneOffset);
  const wettest = snapshot.daily.reduce<Snapshot["daily"][number] | undefined>(
    (best, day) => (!best || day.pop > best.pop ? day : best),
    undefined,
  );

  if (!wettest || wettest.pop < RAIN_WORTH_MENTIONING) {
    lines.push({ kind: "dry", text: `No rain expected in the next ${snapshot.daily.length} days` });
  } else {
    const label = dayLabel(wettest.date, today);
    const when = label === "Today" || label === "Tomorrow" ? label.toLowerCase() : `on ${LONG_DAYS[label] ?? label}`;
    const chance = wettest.pop >= 0.6 ? "Rain likely" : wettest.pop >= 0.35 ? "Chance of rain" : "Slight chance of rain";
    lines.push({ kind: "rain", text: `${chance} ${when} (${formatPercent(wettest.pop)})` });
  }

  if (snapshot.air) {
    const aqi = usAqi(snapshot.air.pm25);
    const band = aqiBand(aqi);
    if (band.level >= 3) lines.push({ kind: "air", text: `${band.label} air (AQI ${aqi})` });
  }
  return lines;
}
