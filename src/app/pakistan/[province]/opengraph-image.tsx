import { PROVINCES, citiesIn, provinceBySlug } from "@/lib/cities";
import { OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Province weather forecast on Skycast";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return PROVINCES.map((province) => ({ province: province.slug }));
}

export default async function Image({ params }: { params: Promise<{ province: string }> }) {
  const province = provinceBySlug((await params).province);
  if (!province) return ogImage("Pakistan weather", "Live forecasts by city");
  return ogImage(`${province.name} weather`, `Live forecasts for ${citiesIn(province.slug).length} places`);
}
