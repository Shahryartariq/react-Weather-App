import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CityCards } from "@/components/Cities";
import { Breadcrumbs, Shell } from "@/components/Shell";
import { PROVINCES, citiesIn, provinceBySlug, provincePath, type Province } from "@/lib/cities";
import { formatTempUnit } from "@/lib/format";
import { PROVINCE_GUIDES } from "@/lib/guides";
import { loadNation, nationSky } from "@/lib/load";
import { parseUnits } from "@/lib/query";
import { pageMeta, provinceSchema, provinceTrail } from "@/lib/seo";
import { SITE_NAME, jsonLd } from "@/lib/site";

const describe = (province: Province) => {
  const cities = citiesIn(province.slug);
  const names = cities.slice(0, 3).map((city) => city.name).join(", ");
  return `Live ${province.name} weather: temperature, rain and 5-day forecasts for ${cities.length} places including ${names}. ${province.nameUr} کا موسم`;
};

export async function generateMetadata({ params, searchParams }: PageProps<"/pakistan/[province]">): Promise<Metadata> {
  const province = provinceBySlug((await params).province);
  if (!province) return {};
  return pageMeta({
    title: `${province.name} Weather Today: Live Forecast by City · ${SITE_NAME}`,
    description: describe(province),
    path: provincePath(province),
    noindex: parseUnits(await searchParams) === "imperial",
  });
}

export default async function ProvincePage({ params, searchParams }: PageProps<"/pakistan/[province]">) {
  const province = provinceBySlug((await params).province);
  if (!province) notFound();
  const units = parseUnits(await searchParams);
  const suffix = units === "imperial" ? "?units=imperial" : "";
  const nation = await loadNation();
  const cities = citiesIn(province.slug);
  const here = nation
    .filter((entry) => entry.city.province === province.slug)
    .sort((a, b) => b.temp - a.temp);
  const hottest = here[0];
  const coldest = here[here.length - 1];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(provinceSchema(province, describe(province))) }}
      />
      <Shell sky={nationSky(nation)} units={units} unitPath={provincePath(province)}>
        <div className="sky sky-flush">
          <Breadcrumbs trail={provinceTrail(province)} />
          <section className="simple-hero" aria-labelledby="province-title">
            <h1 id="province-title">{province.name} weather today</h1>
            <p lang="ur" dir="rtl" className="urdu">
              {province.nameUr} کا موسم
            </p>
            {hottest && coldest && hottest !== coldest && (
              <p>
                Warmest right now is {hottest.city.name} at {formatTempUnit(hottest.temp, units)}. Coolest is{" "}
                {coldest.city.name} at {formatTempUnit(coldest.temp, units)}.
              </p>
            )}
          </section>
        </div>

        <section className="section" aria-labelledby="cities-title">
          <h2 id="cities-title">Weather in {province.name} cities</h2>
          <CityCards cities={cities} now={nation} units={units} />
        </section>

        <section className="section" aria-labelledby="about-title">
          <h2 id="about-title">{province.name} climate</h2>
          <p className="prose">{PROVINCE_GUIDES[province.slug]}</p>
        </section>

        <section className="section" aria-labelledby="others-title">
          <h2 id="others-title">Other regions</h2>
          <ul className="facts">
            {PROVINCES.filter((other) => other.slug !== province.slug).map((other) => (
              <li key={other.slug}>
                <Link href={`${provincePath(other)}${suffix}`}>{other.name} weather</Link>
              </li>
            ))}
          </ul>
        </section>
      </Shell>
    </>
  );
}
