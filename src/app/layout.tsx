import "./globals.css";

import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";

import { AUTHOR, SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";

/**
 * Through next/font rather than a plain CSS import: it preloads the file and sizes the fallback
 * font to match, so long pages don't jump when the real font arrives.
 */
const bricolage = localFont({
  src: "../../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-brand",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: `Pakistan Weather Today · ${SITE_NAME}`, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [AUTHOR],
  creator: AUTHOR.name,
  keywords: ["Pakistan weather", "weather today", "Lahore weather", "Karachi weather", "Islamabad weather", "AQI Pakistan"],
  category: "weather",
  formatDetection: { telephone: false, address: false },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `Pakistan Weather Today · ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_PK",
  },
  twitter: { card: "summary_large_image", title: `Pakistan Weather Today · ${SITE_NAME}`, description: SITE_DESCRIPTION },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#164E8C" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1530" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Off by default: the script 404s until Web Analytics is switched on in the Vercel dashboard.
  const analytics = process.env.ENABLE_WEB_ANALYTICS === "1";
  const nonce = analytics ? ((await headers()).get("x-nonce") ?? undefined) : undefined;
  return (
    <html lang="en-PK" className={bricolage.variable}>
      <body>
        {children}
        {analytics && <script defer src="/_vercel/insights/script.js" nonce={nonce} />}
      </body>
    </html>
  );
}
