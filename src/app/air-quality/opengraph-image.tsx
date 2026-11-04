import { OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Pakistan air quality by city on Skycast";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Pakistan air quality", "AQI and PM2.5 for 50 cities");
}
