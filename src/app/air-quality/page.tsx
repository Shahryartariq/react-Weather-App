import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import { Breadcrumbs, Shell } from "@/components/Shell";
import { cityPath } from "@/lib/cities";
import { aqiBand } from "@/lib/format";
import { loadNation, loadNationAir, nationSky } from "@/lib/load";
import { pageMeta, simplePageSchema } from "@/lib/seo";
import { SITE_NAME, jsonLd } from "@/lib/site";

const PATH = "/air-quality";
const DESCRIPTION =
  "Pakistan air quality today: estimated AQI and PM2.5 for 50 cities, ranked from worst to best, with what each level means for your health during smog season.";

export const metadata: Metadata = pageMeta({
  title: `Pakistan AQI Today: Live Air Quality by City · ${SITE_NAME}`,
  description: DESCRIPTION,
  path: PATH,
});

/** The US AQI levels, shown as a key. */
const KEY = [
  { range: "0–50", aqi: 25 },
  { range: "51–100", aqi: 75 },
  { range: "101–150", aqi: 125 },
  { range: "151–200", aqi: 175 },
  { range: "201–300", aqi: 250 },
  { range: "301+", aqi: 400 },
].map((row) => ({ ...row, band: aqiBand(row.aqi) }));

export default async function AirQualityPage() {
  await connection(); // Rendered per request: a prerendered page can't carry the CSP nonce.
  const [air, nation] = await Promise.all([loadNationAir(), loadNation()]);
  const worst = air[0];
  const best = air[air.length - 1];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(simplePageSchema(PATH, "Pakistan air quality", DESCRIPTION)) }}
      />
      <Shell sky={nationSky(nation)}>
        <div className="sky sky-flush">
          <Breadcrumbs
            trail={[
              { name: "Pakistan", path: "/" },
              { name: "Air quality", path: PATH },
            ]}
          />
          <section className="simple-hero" aria-labelledby="air-title">
            <h1 id="air-title">Pakistan air quality today</h1>
            <p lang="ur" dir="rtl" className="urdu">
              پاکستان میں فضائی معیار
            </p>
            {worst && best && (
              <p>
                {worst.city.name} has the worst estimated air right now, with a US AQI of {worst.aqi} (
                {aqiBand(worst.aqi).label.toLowerCase()}). {best.city.name} has the cleanest, at {best.aqi}.
              </p>
            )}
          </section>
        </div>

        <section className="section" aria-labelledby="ranking-title">
          <h2 id="ranking-title">Cities ranked by air quality</h2>
          {air.length > 0 ? (
            <div className="climate-scroll" tabIndex={0} role="region" aria-label="Air quality by city">
              <table className="climate-table aqi-table">
                <thead>
                  <tr>
                    <th scope="col">Rank</th>
                    <th scope="col">City</th>
                    <th scope="col">US AQI</th>
                    <th scope="col">PM2.5 (µg/m³)</th>
                  </tr>
                </thead>
                <tbody>
                  {air.map(({ city, aqi, pm25 }, i) => {
                    const band = aqiBand(aqi);
                    return (
                      <tr key={city.slug}>
                        <th scope="row">{i + 1}</th>
                        <td>
                          <Link prefetch={false} href={cityPath(city)}>{city.name}</Link>
                        </td>
                        <td>
                          <span className="aqi-label">
                            <span className={`aqi aqi-${band.level}`} aria-hidden="true" />
                            <span className="aqi-value">{aqi}</span>
                            <span>{band.label}</span>
                          </span>
                        </td>
                        <td>{Math.round(pm25)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="prose">Air quality readings aren&apos;t available right now. Please try again shortly.</p>
          )}
          <p className="panel-note">
            Estimates from a global air quality model, updated hourly and converted to the US AQI scale using the
            EPA&apos;s 2024 PM2.5 breakpoints. They&apos;re not readings from local monitors, and the official AQI uses a
            24-hour average, so other sites may show different numbers.
          </p>
        </section>

        <section className="section" aria-labelledby="key-title">
          <h2 id="key-title">What the numbers mean</h2>
          <ul className="aqi-key">
            {KEY.map(({ range, band }) => (
              <li key={range}>
                <span className={`aqi aqi-${band.level}`} aria-hidden="true" />
                <span className="aqi-range">{range}</span>
                <strong>{band.label}</strong>
                <span className="aqi-advice">{band.advice}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="section" aria-labelledby="smog-title">
          <h2 id="smog-title">Smog season in Pakistan</h2>
          <p className="prose">
            Air quality in Punjab is usually at its worst from about late October to January. Smoke from crop burning,
            traffic, brick kilns and industry builds up, and cold, still air holds it close to the ground. Lahore and
            the cities around it are hit hardest. Air usually clears after rain or when the wind picks up, so check{" "}
            <Link prefetch={false} href="/weather/lahore">the Lahore forecast</Link> for what&apos;s coming.
          </p>
        </section>
      </Shell>
    </>
  );
}
