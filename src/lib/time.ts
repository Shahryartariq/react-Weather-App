/**
 * OpenWeather gives times in Unix seconds and each place's offset from UTC in seconds.
 * We shift the timestamp by that offset and then read it as UTC, so the result is the
 * place's local wall-clock time no matter where the server or reader is.
 */
function localDate(unixSeconds: number, offsetSeconds: number): Date {
  return new Date((unixSeconds + offsetSeconds) * 1000);
}

/** Local calendar date, "YYYY-MM-DD". */
export function localDay(unixSeconds: number, offsetSeconds: number): string {
  return localDate(unixSeconds, offsetSeconds).toISOString().slice(0, 10);
}

/** Local hour of the day, 0–23. */
export function localHour(unixSeconds: number, offsetSeconds: number): number {
  return localDate(unixSeconds, offsetSeconds).getUTCHours();
}

/** "3:05 PM" */
export function formatClock(unixSeconds: number, offsetSeconds: number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(localDate(unixSeconds, offsetSeconds));
}

/** "3 PM" */
export function formatHour(unixSeconds: number, offsetSeconds: number): string {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", timeZone: "UTC" }).format(
    localDate(unixSeconds, offsetSeconds),
  );
}

/** "Tuesday, 4 November" */
export function formatLongDate(unixSeconds: number, offsetSeconds: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(localDate(unixSeconds, offsetSeconds));
}

/** "Today", "Tomorrow", then short weekday names ("Thu"). */
export function dayLabel(isoDate: string, todayIso: string): string {
  if (isoDate === todayIso) return "Today";
  const tomorrow = new Date(`${todayIso}T00:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (isoDate === tomorrow.toISOString().slice(0, 10)) return "Tomorrow";
  return new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(
    new Date(`${isoDate}T12:00:00Z`),
  );
}

/** "UTC+5", "UTC−3:30" */
export function formatOffset(offsetSeconds: number): string {
  const sign = offsetSeconds < 0 ? "−" : "+";
  const minutes = Math.abs(offsetSeconds) / 60;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `UTC${sign}${hours}${rest ? `:${String(rest).padStart(2, "0")}` : ""}`;
}
