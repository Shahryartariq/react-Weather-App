export type Theme = "system" | "light" | "dark";

export const THEME_COOKIE = "skycast-theme";

/** A year: long enough that the choice feels permanent, short enough to expire if unused. */
export const THEME_MAX_AGE = 60 * 60 * 24 * 365;

/** The browser's own interface, such as the address bar on phones. */
export const THEME_COLORS = { light: "#164E8C", dark: "#0B1530" };

/** Anything unexpected in the cookie means "follow the system". */
export function parseTheme(value: string | undefined): Theme {
  return value === "light" || value === "dark" ? value : "system";
}
