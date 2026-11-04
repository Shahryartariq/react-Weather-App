"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import type { Theme } from "@/lib/theme";

import { useTheme } from "./ThemeProvider";

const OPTIONS: { value: Theme; label: string; icon: ReactNode }[] = [
  {
    value: "system",
    label: "System",
    icon: (
      <>
        <rect x="3.5" y="5" width="17" height="11.5" rx="2" />
        <path d="M9 20h6M12 16.5V20" />
      </>
    ),
  },
  {
    value: "light",
    label: "Light",
    icon: (
      <>
        <circle cx="12" cy="12" r="3.8" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
      </>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: <path d="M20 14.2A8 8 0 1 1 9.8 4a6.4 6.4 0 0 0 10.2 10.2Z" />,
  },
];

const noSubscribe = () => () => {};

/**
 * System, light or dark as real radio buttons, so arrow keys and screen readers work without
 * extra code. They stay disabled until JavaScript runs: without it there's nothing to switch.
 */
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const ready = useSyncExternalStore(noSubscribe, () => true, () => false);

  return (
    <fieldset className="theme-switch" disabled={!ready}>
      <legend className="visually-hidden">Colour theme</legend>
      {OPTIONS.map(({ value, label, icon }) => (
        <label key={value} title={label}>
          <input
            type="radio"
            name="theme"
            value={value}
            className="visually-hidden"
            checked={theme === value}
            onChange={() => setTheme(value)}
          />
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {icon}
          </svg>
          <span className="visually-hidden">{label}</span>
        </label>
      ))}
    </fieldset>
  );
}
