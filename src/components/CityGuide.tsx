import Link from "next/link";

import type { City } from "@/lib/cities";
import { provinceBySlug, provincePath } from "@/lib/cities";
import { CLIMATE_PERIOD, MONTHS, climateOf, describeMonths, hasRainData, summarise, type Climate } from "@/lib/climate";
import type { Faq } from "@/lib/faq";
import { formatRain, formatTemp, formatTempUnit, tempColor } from "@/lib/format";
import { CITY_GUIDES } from "@/lib/guides";
import type { CityNow } from "@/lib/load";
import type { Units } from "@/lib/types";

import { CityCards } from "./Cities";

/** One row's temperature range on a scale shared by the whole year. */
function RangeBar({ low, high, floor, span }: { low: number; high: number; floor: number; span: number }) {
  const left = ((low - floor) / span) * 100;
  const width = Math.max(((high - low) / span) * 100, 3);
  return (
    <svg className="climate-bar" height="8" aria-hidden="true">
      <rect className="range-track" x="0" y="2" width="100%" height="4" rx="2" />
      <rect x={`${left}%`} y="2" width={`${width}%`} height="4" rx="2" fill={tempColor(high)} />
    </svg>
  );
}

function ClimateTable({ climate, showRain, month, units }: { climate: Climate; showRain: boolean; month: number; units: Units }) {
  const floor = Math.min(...climate.months.map((m) => m.low));
  const span = Math.max(Math.max(...climate.months.map((m) => m.high)) - floor, 1);
  return (
    <div className="climate-scroll" tabIndex={0} role="region" aria-label="Average weather by month">
      <table className="climate-table">
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Low</th>
            <th scope="col" className="climate-bar-cell">
              <span className="visually-hidden">Range</span>
            </th>
            <th scope="col">High</th>
            {showRain && <th scope="col">Rain</th>}
            {showRain && <th scope="col">Rainy days</th>}
          </tr>
        </thead>
        <tbody>
          {climate.months.map((m, i) => (
            <tr key={MONTHS[i]} aria-current={i === month ? "true" : undefined}>
              <th scope="row">{MONTHS[i]}</th>
              <td>{formatTemp(m.low, units)}</td>
              <td className="climate-bar-cell">
                <RangeBar low={m.low} high={m.high} floor={floor} span={span} />
              </td>
              <td>{formatTemp(m.high, units)}</td>
              {showRain && <td>{formatRain(m.rain, units)}</td>}
              {showRain && <td>{Math.round(m.rainDays)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Faqs({ faqs, title }: { faqs: Faq[]; title: string }) {
  if (faqs.length === 0) return null;
  return (
    <section className="section" aria-labelledby="faq-title">
      <h2 id="faq-title">{title}</h2>
      <dl className="faq">
        {faqs.map(({ question, answer }) => (
          <div key={question}>
            <dt>{question}</dt>
            <dd>{answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** The part of a city page that isn't today's forecast: its climate, questions and neighbours. */
export function CityGuide({
  city,
  month,
  nearby,
  now,
  faqs,
  units,
}: {
  city: City;
  /** This month, 0–11, highlighted in the table. */
  month: number;
  nearby: City[];
  now: CityNow[];
  faqs: Faq[];
  units: Units;
}) {
  const climate = climateOf(city.slug);
  const showRain = hasRainData(city.slug);
  const summary = climate && summarise(climate, showRain);
  const province = city.province && provinceBySlug(city.province);
  const suffix = units === "imperial" ? "?units=imperial" : "";

  return (
    <>
      <section className="section" aria-labelledby="climate-title">
        <h2 id="climate-title">{city.name} climate</h2>
        <p className="prose">{CITY_GUIDES[city.slug]}</p>
        {climate && summary && (
          <>
            <ul className="facts">
              <li>
                <span>Elevation</span>
                {climate.elevation.toLocaleString("en-US")} m
              </li>
              <li>
                <span>Hottest month</span>
                {MONTHS[summary.hottest]}, {formatTempUnit(climate.months[summary.hottest].high, units)}
              </li>
              <li>
                <span>Coldest month</span>
                {MONTHS[summary.coldest]}, {formatTempUnit(climate.months[summary.coldest].low, units)}
              </li>
              {showRain && (
                <li>
                  <span>Rain in a year</span>
                  {formatRain(summary.annualRain, units)}
                </li>
              )}
              {summary.mildest.length > 0 && (
                <li>
                  <span>Most comfortable</span>
                  {describeMonths(summary.mildest)}
                </li>
              )}
            </ul>
            <h3>{city.name} weather by month</h3>
            <ClimateTable climate={climate} showRain={showRain} month={month} units={units} />
            <p className="panel-note">
              Averages for {CLIMATE_PERIOD} from the ERA5 climate model, not a local weather station.
              {showRain
                ? " "
                : " Rainfall isn't shown because the model blends this place with the higher ground around it, which overstates rain. "}
              {climate.elevation >= 1000 && "Valley floors can be several degrees warmer by day than these figures."}
            </p>
          </>
        )}
      </section>

      <Faqs faqs={faqs} title={`${city.name} weather questions`} />

      <section className="section" aria-labelledby="nearby-title">
        <h2 id="nearby-title">Weather near {city.name}</h2>
        <CityCards cities={nearby} now={now} units={units} />
        {province && (
          <p className="section-more">
            <Link prefetch={false} href={`${provincePath(province)}${suffix}`}>All {province.name} weather</Link>
          </p>
        )}
      </section>
    </>
  );
}
