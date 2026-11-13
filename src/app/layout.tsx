import "./globals.css";

import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { cookies, headers } from "next/headers";

import { ThemeProvider } from "@/components/ThemeProvider";
import { measurementId } from "@/lib/analytics";
import { AUTHOR, SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";
import { THEME_COLORS, THEME_COOKIE, parseTheme } from "@/lib/theme";

/**
 * Through next/font rather than a plain CSS import: it preloads the file and sizes the fallback
 * font to match, so long pages don't jump when the real font arrives. The file is cut down to
 * the weights and characters the site uses (scripts/subset-font.sh), 8 KB less on every first visit.
 */
const bricolage = localFont({
  src: "../fonts/bricolage-grotesque.woff2",
  weight: "280 700",
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

const readTheme = async () => parseTheme((await cookies()).get(THEME_COOKIE)?.value);

export async function generateViewport(): Promise<Viewport> {
  const theme = await readTheme();
  if (theme !== "system") return { colorScheme: theme, themeColor: THEME_COLORS[theme] };
  return {
    colorScheme: "light dark",
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
      { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
    ],
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const gaId = measurementId();
  // The proxy puts this request's CSP nonce in x-nonce; the analytics scripts need it to run.
  const nonce = gaId ? ((await headers()).get("x-nonce") ?? undefined) : undefined;
  // Read on the server so the first paint is already right. "System" leaves it to CSS.
  const theme = await readTheme();
  // Extensions like Grammarly and Dark Reader add attributes to these two tags before React loads.
  // suppressHydrationWarning covers only the tag's own attributes, so the page inside is still checked.
  return (
    <html
      lang="en-PK"
      className={bricolage.variable}
      data-theme={theme === "system" ? undefined : theme}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <ThemeProvider initial={theme}>{children}</ThemeProvider>
      </body>
      {gaId && <GoogleAnalytics gaId={gaId} nonce={nonce} />}
    </html>
  );
}
