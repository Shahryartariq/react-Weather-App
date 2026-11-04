import { OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Skycast: weather forecast for any city";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Weather for any city", "Now, the next 24 hours and 5 days ahead");
}
