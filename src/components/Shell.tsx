import Link from "next/link";
import type { ReactNode } from "react";

import { HILL_STATIONS, MAJOR, PROVINCES, cityBySlug, cityPath, provincePath } from "@/lib/cities";
import { usingSampleData } from "@/lib/openweather";
import { AUTHOR, SOURCE_URL } from "@/lib/site";
import type { Place, Sky, Units } from "@/lib/types";

import { SearchBox } from "./SearchBox";
import { ThemeSwitch } from "./ThemeSwitch";
import { UnitSwitch } from "./UnitSwitch";

/** Offered in the search box before someone has searched for anything. */
const POPULAR: Place[] = MAJOR.slice(0, 6).map((slug) => {
  const { name, region, country, lat, lon } = cityBySlug(slug)!;
  return { name, region, country, lat, lon };
});

const SHORT_NAMES: Record<string, string> = { "khyber-pakhtunkhwa": "KP", "gilgit-baltistan": "Gilgit-Baltistan" };

/**
 * What every page shares: skip link, header with search, region links, and a footer that links
 * to the main pages. Those links are how search engines reach all 50 cities.
 *
 * Links across the site turn prefetching off. Every page here renders per request, so prefetching
 * gains almost nothing, and with this many links it sent 30 to 45 requests per page view.
 */
export function Shell({
  sky,
  units = "metric",
  unitPath,
  keep,
  region,
  children,
}: {
  sky: Sky;
  /** The region link to mark as current: a province slug, or "air-quality". */
  region?: string;
  units?: Units;
  /** Path the °C/°F links point at. Pages without temperatures leave it out. */
  unitPath?: string;
  /** Query parameters the °C/°F links keep (the place on a lookup). */
  keep?: URLSearchParams;
  children: ReactNode;
}) {
  const suffix = units === "imperial" ? "?units=imperial" : "";
  return (
    <div className="page" data-sky={sky}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <Link prefetch={false} href={`/${suffix}`} className="brand" aria-label="Skycast Pakistan home">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="12" cy="13" r="6" className="brand-sun" />
            <path d="M9 24h14a5 5 0 0 0 .6-9.96A6.5 6.5 0 0 0 11.3 16.1 4 4 0 0 0 9 24Z" className="brand-cloud" />
          </svg>
          Skycast <span className="brand-tag">Pakistan</span>
        </Link>
        <div className="tools">
          <SearchBox units={units} popular={POPULAR} />
          <Link prefetch={false} href={`/my-location${suffix}`} className="icon-button" title="Weather at my location">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21.5s-6.5-6.2-6.5-11.5a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11.5-6.5 11.5Z" />
              <circle cx="12" cy="10" r="2.4" />
            </svg>
            <span className="visually-hidden">Weather at my location</span>
          </Link>
          {unitPath && <UnitSwitch units={units} basePath={unitPath} params={keep ?? new URLSearchParams()} />}
        </div>
        <ThemeSwitch />
      </header>
      <nav className="regions" aria-label="Regions of Pakistan">
        <ul>
          {PROVINCES.map((province) => (
            <li key={province.slug}>
              <Link
                prefetch={false}
                href={`${provincePath(province)}${suffix}`}
                aria-current={region === province.slug ? "page" : undefined}
              >
                {SHORT_NAMES[province.slug] ?? province.name}
              </Link>
            </li>
          ))}
          <li>
            <Link prefetch={false} href="/air-quality" aria-current={region === "air-quality" ? "page" : undefined}>
              Air quality
            </Link>
          </li>
        </ul>
      </nav>

      <main id="main" tabIndex={-1}>
        {children}
      </main>

      <Footer units={units} />
    </div>
  );
}

function CityLinks({ slugs, suffix }: { slugs: string[]; suffix: string }) {
  return (
    <ul>
      {slugs.map((slug) => {
        const city = cityBySlug(slug)!;
        return (
          <li key={slug}>
            <Link prefetch={false} href={`${cityPath(city)}${suffix}`}>{city.name} weather</Link>
          </li>
        );
      })}
    </ul>
  );
}

function Footer({ units }: { units: Units }) {
  const suffix = units === "imperial" ? "?units=imperial" : "";
  return (
    <footer className="footer">
      <div className="footer-links">
        <nav aria-label="Major cities">
          <h2>Major cities</h2>
          <CityLinks slugs={MAJOR} suffix={suffix} />
        </nav>
        <nav aria-label="Hill stations and valleys">
          <h2>Hill stations</h2>
          <CityLinks slugs={HILL_STATIONS} suffix={suffix} />
        </nav>
        <nav aria-label="Provinces">
          <h2>Provinces</h2>
          <ul>
            {PROVINCES.map((province) => (
              <li key={province.slug}>
                <Link prefetch={false} href={`${provincePath(province)}${suffix}`}>{province.name} weather</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="About Skycast">
          <h2>Skycast</h2>
          <ul>
            <li>
              <Link prefetch={false} href="/air-quality">Pakistan air quality</Link>
            </li>
            <li>
              <Link prefetch={false} href={`/my-location${suffix}`}>Weather at my location</Link>
            </li>
            <li>
              <Link prefetch={false} href="/about">About and data sources</Link>
            </li>
            <li>
              <a href={SOURCE_URL} rel="noopener">
                Source code
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="footer-credits">
        <p>
          Weather and air quality from{" "}
          <a href="https://openweathermap.org/" rel="noopener">
            OpenWeather
          </a>
          . Climate averages from{" "}
          <a href="https://open-meteo.com/" rel="noopener">
            Open-Meteo
          </a>{" "}
          (ERA5,{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener">
            CC BY 4.0
          </a>
          ). Map from{" "}
          <a href="https://www.naturalearthdata.com/" rel="noopener">
            Natural Earth
          </a>
          .
        </p>
        <p>
          For official warnings, follow the{" "}
          <a href="https://www.pmd.gov.pk/" rel="noopener">
            Pakistan Meteorological Department
          </a>{" "}
          and{" "}
          <a href="https://www.ndma.gov.pk/" rel="noopener">
            NDMA
          </a>
          .
        </p>
        {usingSampleData() && <p className="sample-badge">Sample data: set OPENWEATHER_API_KEY for live weather.</p>}
        <p>
          Made by{" "}
          <a href={AUTHOR.url} rel="noopener">
            {AUTHOR.name}
          </a>
        </p>
      </div>
    </footer>
  );
}

/** A visible trail of links, matching the BreadcrumbList in the structured data. */
export function Breadcrumbs({ trail }: { trail: { name: string; path: string }[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <ol>
        {trail.map(({ name, path }, i) => (
          <li key={path}>
            {i === trail.length - 1 ? <span aria-current="page">{name}</span> : <Link prefetch={false} href={path}>{name}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
