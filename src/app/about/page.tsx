import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import { Breadcrumbs, Shell } from "@/components/Shell";
import { measurementId } from "@/lib/analytics";
import { CITIES } from "@/lib/cities";
import { CLIMATE_PERIOD } from "@/lib/climate";
import { pageMeta, simplePageSchema } from "@/lib/seo";
import { AUTHOR, SITE_NAME, SOURCE_URL, jsonLd } from "@/lib/site";

const PATH = "/about";
const DESCRIPTION =
  "How Skycast works: where its Pakistan weather, air quality and climate data come from, how often it updates, and what its limits are.";

export const metadata: Metadata = pageMeta({ title: `About and Data Sources · ${SITE_NAME}`, description: DESCRIPTION, path: PATH });

export default async function AboutPage() {
  await connection(); // Rendered per request: a prerendered page can't carry the CSP nonce.
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(simplePageSchema(PATH, "About Skycast", DESCRIPTION)) }}
      />
      <Shell sky="clear">
        <div className="sky sky-flush">
          <Breadcrumbs
            trail={[
              { name: "Pakistan", path: "/" },
              { name: "About", path: PATH },
            ]}
          />
          <section className="simple-hero" aria-labelledby="about-title">
            <h1 id="about-title">About Skycast</h1>
            <p>
              A free, ad-free weather site for Pakistan, covering {CITIES.length} cities, hill stations and valleys.
            </p>
          </section>
        </div>

        <section className="section" aria-labelledby="sources-title">
          <h2 id="sources-title">Where the data comes from</h2>
          <dl className="faq">
            <div>
              <dt>Current weather and forecasts</dt>
              <dd>
                From OpenWeather. Current conditions refresh every 10 minutes and the forecast every 30 minutes, in
                3-hour steps for the next 5 days.
              </dd>
            </div>
            <div>
              <dt>Air quality</dt>
              <dd>
                PM2.5 from OpenWeather&apos;s air pollution model, refreshed hourly and converted to the US AQI scale.
                These are model estimates, not readings from local monitors.
              </dd>
            </div>
            <div>
              <dt>Climate averages</dt>
              <dd>
                Daily ERA5 reanalysis for {CLIMATE_PERIOD}, from Open-Meteo under CC BY 4.0, averaged by month for each
                city.
              </dd>
            </div>
            <div>
              <dt>City notes</dt>
              <dd>Written by hand for each place, to explain what makes its weather different.</dd>
            </div>
          </dl>
        </section>

        <section className="section" aria-labelledby="limits-title">
          <h2 id="limits-title">What to keep in mind</h2>
          <p className="prose">
            Skycast isn&apos;t an official warning service. For flood, heat wave and storm alerts, follow the{" "}
            <a href="https://www.pmd.gov.pk/" rel="noopener">
              Pakistan Meteorological Department
            </a>{" "}
            and the{" "}
            <a href="https://www.ndma.gov.pk/" rel="noopener">
              National Disaster Management Authority
            </a>
            .
          </p>
          <p className="prose">
            Mountain weather is hard to model. Forecasts for high valleys can miss local conditions, and climate
            averages can run several degrees cool there. Rainfall averages are left out for places in deep valleys or
            beside high ground, because the model overstates them.
          </p>
          <p className="prose">
            The map on the home page uses a Natural Earth outline. It&apos;s simplified to show where cities are, and
            isn&apos;t an authority on borders.
          </p>
        </section>

        <section className="section" aria-labelledby="who-title">
          <h2 id="who-title">Who built it</h2>
          <p className="prose">
            Skycast is built and maintained by{" "}
            <a href={AUTHOR.url} rel="noopener">
              {AUTHOR.name}
            </a>
            . It&apos;s a Next.js and TypeScript project with end-to-end tests and a strict Content Security Policy. The{" "}
            <a href={SOURCE_URL} rel="noopener">
              source code
            </a>{" "}
            is open. {SITE_NAME} has no ads and no accounts. If you use your location, it&apos;s rounded to about 1 km
            first.{measurementId() !== null && " Visits are counted with Google Analytics."}{" "}
            <Link prefetch={false} href="/">See today&apos;s weather</Link>.
          </p>
        </section>
      </Shell>
    </>
  );
}
