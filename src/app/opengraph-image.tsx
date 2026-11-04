import { OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Skycast: Pakistan weather today";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Pakistan weather today", "Live forecasts and air quality for 50 cities");
}
