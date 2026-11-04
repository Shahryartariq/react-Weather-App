"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { THEME_COLORS, THEME_COOKIE, THEME_MAX_AGE, parseTheme, type Theme } from "@/lib/theme";

const CHANNEL = "skycast:theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function saveCookie(theme: Theme) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  const lifetime = theme === "system" ? 0 : THEME_MAX_AGE; // "System" is the default, so nothing is stored.
  document.cookie = `${THEME_COOKIE}=${theme}; Path=/; Max-Age=${lifetime}; SameSite=Lax${secure}`;
}

function readCookie(): Theme {
  const entry = document.cookie.split("; ").find((pair) => pair.startsWith(`${THEME_COOKIE}=`));
  return parseTheme(entry?.split("=")[1]);
}

/** Updates the page and the browser's own interface. CSS does the rest from data-theme. */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;

  const resolved = theme === "system" ? (matchMedia(DARK_QUERY).matches ? "dark" : "light") : theme;
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    meta.content = THEME_COLORS[resolved];
    meta.removeAttribute("media");
  }
  const scheme = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  if (scheme) scheme.content = theme === "system" ? "light dark" : theme;
}

const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>({
  theme: "system",
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

/**
 * Holds the reader's choice. The server already rendered the right theme from the cookie,
 * so there's no flash on load and no inline script for the Content Security Policy to allow.
 */
export function ThemeProvider({ initial, children }: { initial: Theme; children: ReactNode }) {
  const [theme, setThemeState] = useState(initial);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    saveCookie(next);
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(CHANNEL);
      channel.postMessage(next);
      channel.close();
    }
  }, []);

  useEffect(() => {
    const adopt = (next: Theme) => {
      setThemeState(next);
      applyTheme(next);
    };

    // Other tabs follow along.
    const channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL) : null;
    if (channel) channel.onmessage = (event: MessageEvent<string>) => adopt(parseTheme(event.data));

    // A page restored by the Back button may predate the latest choice.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) adopt(readCookie());
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      channel?.close();
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  // CSS follows the system on its own; the browser's interface colour needs a nudge.
  useEffect(() => {
    if (theme !== "system") return;
    const query = matchMedia(DARK_QUERY);
    const onChange = () => applyTheme("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
