import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the sun-and-cloud mark on the clear-sky blue. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#164E8C" }}>
        <svg width="180" height="180" viewBox="0 0 32 32">
          <circle cx="12" cy="13" r="6" fill="#FFD56B" />
          <path d="M9 24h14a5 5 0 0 0 .6-9.96A6.5 6.5 0 0 0 11.3 16.1 4 4 0 0 0 9 24Z" fill="#fff" />
        </svg>
      </div>
    ),
    size,
  );
}
