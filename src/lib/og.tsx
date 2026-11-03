import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** The social card: a clear sky, the mark, a big title and one line under it. */
export function ogImage(title: string, subtitle: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(180deg, #164E8C 0%, #2F6CA8 100%)",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 40, fontWeight: 700 }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <circle cx="12" cy="13" r="6" fill="#FFD56B" />
            <path d="M9 24h14a5 5 0 0 0 .6-9.96A6.5 6.5 0 0 0 11.3 16.1 4 4 0 0 0 9 24Z" fill="#fff" />
          </svg>
          Skycast
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>{title}</div>
          <div style={{ fontSize: 38, opacity: 0.92 }}>{subtitle}</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
