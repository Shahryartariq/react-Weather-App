import data from "./data/climate.json";

export interface MonthClimate {
  /** Average daily high, °C. */
  high: number;
  /** Average daily low, °C. */
  low: number;
  /** Average total for the month, mm. */
  rain: number;
  /** Average days with at least 1 mm of rain. */
  rainDays: number;
}

export interface Climate {
  /** Metres above sea level. */
  elevation: number;
  months: MonthClimate[];
}

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** The years the averages cover, such as "2016–2025". */
export const CLIMATE_PERIOD: string = data.period;

/**
 * ERA5 blends a valley with the peaks around it, which inflates rainfall several times over:
 * it gives Gilgit about 1,400 mm a year, while weather stations in Gilgit-Baltistan measure
 * roughly 150 to 500 mm. Better to show no rain figure here than a wrong one.
 */
const RAIN_UNRELIABLE = new Set([
  "astore",
  "chitral",
  "gilgit",
  "hunza",
  "kalam",
  "mardan",
  "naran",
  "neelum-valley",
  "skardu",
  "ziarat",
]);

export const hasRainData = (slug: string) => !RAIN_UNRELIABLE.has(slug);

export function climateOf(slug: string): Climate | undefined {
  return (data.cities as Record<string, Climate>)[slug];
}

export interface ClimateSummary {
  hottest: number;
  coldest: number;
  wettest: number;
  annualRain: number;
  /** Months warm enough to enjoy and neither too hot nor too wet. */
  mildest: number[];
}

/** Daytime highs people find comfortable outdoors. */
const MILD_HIGH = [16, 31];
const WET_MONTH_MM = 120;

const peak = (months: MonthClimate[], score: (month: MonthClimate) => number) =>
  months.reduce((best, month, i) => (score(month) > score(months[best]) ? i : best), 0);

export function summarise({ months }: Climate, useRain = true): ClimateSummary {
  const mild = months.flatMap((month, i) =>
    month.high >= MILD_HIGH[0] && month.high <= MILD_HIGH[1] && (!useRain || month.rain <= WET_MONTH_MM) ? [i] : [],
  );
  return {
    hottest: peak(months, (m) => m.high),
    coldest: peak(months, (m) => -m.low),
    wettest: peak(months, (m) => m.rain),
    annualRain: months.reduce((sum, month) => sum + month.rain, 0),
    mildest: mild,
  };
}

/** Turns month numbers into words, joining runs: [9, 10, 11, 0, 1] is "October to February". */
export function describeMonths(indices: number[]): string {
  if (indices.length === 0) return "";
  if (indices.length === 12) return "all year";
  const included = new Set(indices);
  // Start each run at a month whose previous month isn't included, wrapping past December.
  const starts = [...included].filter((i) => !included.has((i + 11) % 12)).sort((a, b) => a - b);
  const parts = starts.flatMap((start) => {
    let end = start;
    while (included.has((end + 1) % 12)) end = (end + 1) % 12;
    if (start === end) return [MONTHS[start]];
    if ((start + 1) % 12 === end) return [MONTHS[start], MONTHS[end]];
    return [`${MONTHS[start]} to ${MONTHS[end]}`];
  });
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}
