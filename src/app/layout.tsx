import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "Skycast", template: "%s · Skycast" },
  description:
    "Current weather, the next 24 hours and a 5-day forecast for any city, with wind, humidity, sunrise and air quality.",
  applicationName: "Skycast",
  authors: [{ name: "Muhammad Shehryar", url: "https://github.com/Shahryartariq" }],
  openGraph: { type: "website", siteName: "Skycast" },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F6F8" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1217" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
