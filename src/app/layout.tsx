import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";

import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

import { measurementId } from "@/lib/analytics";
import { AUTHOR, SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [AUTHOR],
  creator: AUTHOR.name,
  keywords: ["weather", "weather forecast", "5-day forecast", "hourly forecast", "air quality", "Next.js"],
  category: "weather",
  formatDetection: { telephone: false, address: false },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME}: weather forecast for any city`,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#164E8C" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1530" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const gaId = measurementId();
  // The proxy puts this request's CSP nonce in x-nonce; the analytics scripts need it to run.
  const nonce = gaId ? ((await headers()).get("x-nonce") ?? undefined) : undefined;
  return (
    <html lang="en">
      <body>{children}</body>
      {gaId && <GoogleAnalytics gaId={gaId} nonce={nonce} />}
    </html>
  );
}
