import type { Condition } from "@/lib/types";

const CLOUD = "M7.5 18.5h9.25a3.75 3.75 0 0 0 .4-7.48A5.25 5.25 0 0 0 7.1 9.6 4.45 4.45 0 0 0 7.5 18.5Z";
const SMALL_CLOUD = "M7.5 15.5h8.6a3.2 3.2 0 0 0 .35-6.38A4.6 4.6 0 0 0 7.6 7.9a3.82 3.82 0 0 0-.1 7.6Z";

function Sun({ cx = 12, cy = 12, r = 4 }: { cx?: number; cy?: number; r?: number }) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const inner = r + 2.2;
    const outer = r + 4;
    return (
      <line
        key={i}
        x1={cx + Math.cos(a) * inner}
        y1={cy + Math.sin(a) * inner}
        x2={cx + Math.cos(a) * outer}
        y2={cy + Math.sin(a) * outer}
      />
    );
  });
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} />
      {rays}
    </g>
  );
}

function Moon({ shift = 0 }: { shift?: number }) {
  return <path d="M15.5 4.6a7.5 7.5 0 1 0 3.9 11.9A6 6 0 0 1 15.5 4.6Z" transform={`translate(${shift} ${shift})`} />;
}

function Glyph({ condition, isDay }: { condition: Condition; isDay: boolean }) {
  switch (condition) {
    case "clear":
      return isDay ? <Sun /> : <Moon />;
    case "partly":
      return (
        <>
          <g transform="translate(-3.2 -3.4) scale(0.72)">{isDay ? <Sun r={4.2} /> : <Moon />}</g>
          <path d={CLOUD} transform="translate(1.6 1)" className="fill-bg" />
        </>
      );
    case "clouds":
      return (
        <>
          <path d={SMALL_CLOUD} transform="translate(3.2 -2.6) scale(0.8)" />
          <path d={CLOUD} className="fill-bg" />
        </>
      );
    case "drizzle":
      return (
        <>
          <path d={SMALL_CLOUD} />
          <path d="M9 19v.01M12 18v.01M15 19v.01M10.5 21.5v.01M13.5 21.5v.01" />
        </>
      );
    case "rain":
      return (
        <>
          <path d={SMALL_CLOUD} />
          <path d="m9.2 18-1 2.6M12.6 18l-1 2.6M16 18l-1 2.6" />
        </>
      );
    case "thunder":
      return (
        <>
          <path d={SMALL_CLOUD} />
          <path d="m12.6 15.8-2.3 3.6h3l-2 3.3" />
        </>
      );
    case "snow":
      return (
        <>
          <path d={SMALL_CLOUD} />
          <path d="M9 18.5v.01M12 18v.01M15 18.5v.01M10.5 21v.01M13.5 21v.01" className="snow" />
        </>
      );
    case "mist":
      return <path d="M4 9.5c2.2-1.4 4.2-1.4 6.4 0s4.2 1.4 6.4 0 2.2-.9 3.2-.6M4 14c2.2-1.4 4.2-1.4 6.4 0s4.2 1.4 6.4 0 2.2-.9 3.2-.6M6 18.5c1.9-1.1 3.6-1.1 5.4 0s3.6 1.1 5.4 0" />;
  }
}

export function WeatherIcon({
  condition,
  isDay = true,
  size = 24,
  className,
}: {
  condition: Condition;
  isDay?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={["wx-icon", className].filter(Boolean).join(" ")}
    >
      <Glyph condition={condition} isDay={isDay} />
    </svg>
  );
}
