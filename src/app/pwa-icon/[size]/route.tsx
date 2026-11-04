import { ImageResponse } from "next/og";

const SIZES = [192, 512];

export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

/** App icons for "Add to Home Screen" on Android, which needs PNGs at these two sizes. */
export async function GET(_request: Request, { params }: RouteContext<"/pwa-icon/[size]">) {
  const size = Number((await params).size);
  if (!SIZES.includes(size)) return new Response(null, { status: 404 });
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#164E8C" }}>
        {/* Kept inside the middle 80% so it survives the circular crop of a maskable icon. */}
        <svg width={size} height={size} viewBox="-5 -5 42 42">
          <circle cx="12" cy="13" r="6" fill="#FFD56B" />
          <path d="M9 24h14a5 5 0 0 0 .6-9.96A6.5 6.5 0 0 0 11.3 16.1 4 4 0 0 0 9 24Z" fill="#fff" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
