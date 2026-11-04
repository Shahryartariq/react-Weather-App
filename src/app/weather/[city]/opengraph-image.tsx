import { cityBySlug, CITIES } from "@/lib/cities";
import { OG_SIZE, ogImage } from "@/lib/og";

export const alt = "City weather forecast on Skycast";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return CITIES.map((city) => ({ city: city.slug }));
}

export default async function Image({ params }: { params: Promise<{ city: string }> }) {
  const city = cityBySlug((await params).city);
  const where = city ? [city.region, city.country].filter(Boolean).join(", ") : "";
  return ogImage(city ? `${city.name} weather` : "Weather forecast", where || "Hourly and 5-day forecast");
}
