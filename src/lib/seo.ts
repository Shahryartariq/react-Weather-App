import type { Metadata } from "next";

import { cityPath, provinceBySlug, provincePath, type City, type Province } from "./cities";
import { AUTHOR, SITE_DESCRIPTION, SITE_NAME, SOURCE_URL, siteUrl } from "./site";

const DEFAULT_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME}: Pakistan weather` };

/**
 * Everything a page needs for search and sharing, set together. Next.js replaces `openGraph`
 * and `twitter` as whole objects, so setting only part of them would lose the rest.
 */
export function pageMeta({
  title,
  description,
  path,
  noindex = false,
  siteImage = false,
}: {
  /** The full title, brand included. */
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  /** For pages without an opengraph-image file of their own: use the site-wide card. */
  siteImage?: boolean;
}): Metadata {
  const images = siteImage ? [DEFAULT_IMAGE] : undefined;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    robots: noindex ? { index: false, follow: true } : undefined,
    // Setting `images` at all, even to undefined, would hide a route's own opengraph-image file.
    openGraph: { type: "website", siteName: SITE_NAME, locale: "en_PK", title, description, url: path, ...(images && { images }) },
    twitter: { card: "summary_large_image", title, description, ...(images && { images: images.map((image) => image.url) }) },
  };
}

const absolute = (path: string) => new URL(path, siteUrl()).toString();

const PAKISTAN = { "@type": "Country", name: "Pakistan", identifier: "PK" };

function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map(({ name, path }, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: absolute(path),
    })),
  };
}

/** What a page is, for structured data and the breadcrumb on screen. */
export function cityTrail(city: City) {
  const province = city.province && provinceBySlug(city.province);
  return [
    { name: "Pakistan", path: "/" },
    ...(province ? [{ name: province.name, path: provincePath(province) }] : []),
    { name: city.name, path: cityPath(city) },
  ];
}

export function provinceTrail(province: Province) {
  return [
    { name: "Pakistan", path: "/" },
    { name: province.name, path: provincePath(province) },
  ];
}

const website = () => ({
  "@type": "WebSite",
  "@id": `${absolute("/")}#website`,
  name: SITE_NAME,
  url: absolute("/"),
  description: SITE_DESCRIPTION,
  inLanguage: "en-PK",
  publisher: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url },
});

const webPage = (path: string, name: string, description: string, about: object) => ({
  "@type": "WebPage",
  name,
  description,
  url: absolute(path),
  inLanguage: "en-PK",
  isPartOf: { "@id": `${absolute("/")}#website` },
  about,
});

export function homeSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...website(),
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${absolute("/")}?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "WebApplication",
        name: SITE_NAME,
        url: absolute("/"),
        applicationCategory: "WeatherApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires a modern web browser",
        offers: { "@type": "Offer", price: "0", priceCurrency: "PKR" },
        author: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url },
        codeRepository: SOURCE_URL,
        areaServed: PAKISTAN,
      },
    ],
  };
}

export function citySchema(city: City, description: string) {
  const province = city.province && provinceBySlug(city.province);
  return {
    "@context": "https://schema.org",
    "@graph": [
      website(),
      webPage(cityPath(city), `${city.name} weather`, description, {
        "@type": "City",
        name: city.name,
        alternateName: city.nameUr,
        geo: { "@type": "GeoCoordinates", latitude: city.lat, longitude: city.lon },
        containedInPlace: province
          ? { "@type": "AdministrativeArea", name: province.name, containedInPlace: PAKISTAN }
          : PAKISTAN,
      }),
      breadcrumbs(cityTrail(city)),
    ],
  };
}

export function provinceSchema(province: Province, description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      website(),
      webPage(provincePath(province), `${province.name} weather`, description, {
        "@type": "AdministrativeArea",
        name: province.name,
        alternateName: province.nameUr,
        containedInPlace: PAKISTAN,
      }),
      breadcrumbs(provinceTrail(province)),
    ],
  };
}

export function simplePageSchema(path: string, name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      website(),
      webPage(path, name, description, PAKISTAN),
      breadcrumbs([
        { name: "Pakistan", path: "/" },
        { name, path },
      ]),
    ],
  };
}
