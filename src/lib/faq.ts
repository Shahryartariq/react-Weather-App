import type { City } from "./cities";
import { MONTHS, describeMonths, hasRainData, summarise, type Climate } from "./climate";
import { conditionLabel } from "./conditions";
import { aqiBand, formatPercent, formatRain, formatTempUnit, usAqi } from "./format";
import type { CityAir, CityNow } from "./load";
import { dayLabel, localDay } from "./time";
import type { Snapshot, Units } from "./types";

export interface Faq {
  question: string;
  answer: string;
}

/** Below this, rain isn't worth a mention. Matches what the forecast shows. */
const RAIN_WORTH_MENTIONING = 0.2;

function rainAnswer(city: City, snapshot: Snapshot): string {
  const today = localDay(snapshot.observedAt, snapshot.timezoneOffset);
  const wettest = snapshot.daily.reduce((best, day) => (day.pop > best.pop ? day : best), snapshot.daily[0]);
  if (!wettest || wettest.pop < RAIN_WORTH_MENTIONING) {
    return `No rain is expected in ${city.name} over the next ${snapshot.daily.length} days.`;
  }
  const when = dayLabel(wettest.date, today);
  const day = when === "Today" || when === "Tomorrow" ? when.toLowerCase() : `on ${when}`;
  return `The best chance of rain in ${city.name} is ${day}, at ${formatPercent(wettest.pop)}.`;
}

/** Questions people type into search, answered from the same data the page shows. */
export function cityFaqs(city: City, snapshot: Snapshot, climate: Climate | undefined, units: Units): Faq[] {
  const { current, air } = snapshot;
  const faqs: Faq[] = [
    {
      question: `What is the temperature in ${city.name} right now?`,
      answer: `It's ${formatTempUnit(current.temp, units)} in ${city.name} and ${conditionLabel(
        current.condition,
        current.isDay,
      ).toLowerCase()}. It feels like ${formatTempUnit(current.feelsLike, units)}, with humidity at ${current.humidity}%.`,
    },
    { question: `Will it rain in ${city.name} this week?`, answer: rainAnswer(city, snapshot) },
  ];

  if (air) {
    const aqi = usAqi(air.pm25);
    faqs.push({
      question: `What is the AQI in ${city.name} today?`,
      answer: `The estimated US AQI in ${city.name} is ${aqi}, which is "${aqiBand(aqi).label}", with PM2.5 at ${Math.round(air.pm25)} µg/m³. This comes from an air quality model, not a local monitor.`,
    });
  }

  if (climate) {
    const rainKnown = hasRainData(city.slug);
    const summary = summarise(climate, rainKnown);
    const hottest = climate.months[summary.hottest];
    const coldest = climate.months[summary.coldest];
    const wettest = climate.months[summary.wettest];
    faqs.push({
      question: `What is the hottest month in ${city.name}?`,
      answer: `${MONTHS[summary.hottest]} is the hottest month, with an average high of ${formatTempUnit(hottest.high, units)}. ${MONTHS[summary.coldest]} is the coldest, with an average low of ${formatTempUnit(coldest.low, units)}.`,
    });
    if (rainKnown) {
      faqs.push({
        question: `Which month gets the most rain in ${city.name}?`,
        answer: `${MONTHS[summary.wettest]} is the wettest month, with about ${formatRain(wettest.rain, units)} on average. The yearly total is about ${formatRain(summary.annualRain, units)}.`,
      });
    }
    if (summary.mildest.length > 0) {
      const months = describeMonths(summary.mildest);
      const verb = summary.mildest.length === 1 ? "is" : "are";
      faqs.push({
        question: `What is the best time to visit ${city.name}?`,
        answer: rainKnown
          ? `For comfortable daytime temperatures and little rain, ${months} ${verb} usually best.`
          : `For comfortable daytime temperatures, ${months} ${verb} usually best.`,
      });
    }
  }
  return faqs;
}

export function nationFaqs(nation: CityNow[], air: CityAir[], units: Units): Faq[] {
  if (nation.length === 0) return [];
  const byTemp = [...nation].sort((a, b) => b.temp - a.temp);
  const hottest = byTemp[0];
  const coldest = byTemp[byTemp.length - 1];
  const raining = nation.filter((n) => ["rain", "drizzle", "thunder"].includes(n.condition));
  const faqs: Faq[] = [
    {
      question: "What is the hottest city in Pakistan today?",
      answer: `Right now it's ${hottest.city.name}, at ${formatTempUnit(hottest.temp, units)}, among the ${nation.length} cities we track.`,
    },
    {
      question: "What is the coldest place in Pakistan right now?",
      answer: `${coldest.city.name} is the coldest of the cities we track, at ${formatTempUnit(coldest.temp, units)}.`,
    },
    {
      question: "Where is it raining in Pakistan today?",
      answer:
        raining.length > 0
          ? `Rain is being reported in ${raining
              .slice(0, 5)
              .map((n) => n.city.name)
              .join(", ")}${raining.length > 5 ? ` and ${raining.length - 5} more cities` : ""}.`
          : "None of the cities we track is reporting rain right now.",
    },
  ];
  if (air[0]) {
    faqs.push({
      question: "Which city has the worst air quality in Pakistan today?",
      answer: `${air[0].city.name} has the highest estimated reading right now, with a US AQI of ${air[0].aqi}. See the full ranking on the air quality page.`,
    });
  }
  return faqs;
}
