import outline from "@/lib/data/pakistan-outline.json";
import { formatTemp, tempColor } from "@/lib/format";
import type { CityNow } from "@/lib/load";
import { MAP_HEIGHT, MAP_WIDTH, mapX as x, mapY as y } from "@/lib/map";
import type { Units } from "@/lib/types";

interface Label {
  side: "start" | "end";
  /** Moves the label down, clear of its neighbours. */
  drop?: number;
  /** Moves the label sideways out of a cluster, with a line back to its dot. */
  leader?: number;
}

const DOT_GAP = 13;

/** Cities that get a label. Positions are hand-placed so none collide. */
const LABELS: Record<string, Label> = {
  hunza: { side: "start" },
  gilgit: { side: "start" },
  skardu: { side: "start" },
  peshawar: { side: "end" },
  islamabad: { side: "start", leader: 34 },
  lahore: { side: "start" },
  quetta: { side: "end" },
  multan: { side: "start" },
  sukkur: { side: "start" },
  gwadar: { side: "start" },
  karachi: { side: "end", drop: 18 },
};

/**
 * Pakistan, with every city as a dot at its real position, coloured by its temperature.
 * The outline is a single SVG path built by scripts/build-map.ts, so there's no map library.
 */
export function PakistanMap({ nation, units }: { nation: CityNow[]; units: Units }) {
  const labelled = nation.filter(({ city }) => LABELS[city.slug]);
  return (
    <svg
      className="pk-map"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="img"
      aria-label={`Map of the temperature right now in ${nation.length} cities across Pakistan`}
    >
      <path d={outline.path} className="pk-outline" />
      {labelled.map(({ city }) => {
        const { leader } = LABELS[city.slug];
        if (!leader) return null;
        const cy = y(city.lat);
        return <line key={city.slug} x1={x(city.lon)} y1={cy} x2={x(city.lon) + leader + 9} y2={cy} className="pk-leader" />;
      })}
      {nation.map(({ city, temp }) => (
        <circle key={city.slug} cx={x(city.lon)} cy={y(city.lat)} r="7" fill={tempColor(temp)} className="pk-dot" />
      ))}
      {labelled.map(({ city, temp }) => {
        const { side, drop = 0, leader = 0 } = LABELS[city.slug];
        return (
          <text
            key={city.slug}
            x={x(city.lon) + (side === "start" ? DOT_GAP + leader : -DOT_GAP)}
            y={y(city.lat) + 5 + drop}
            textAnchor={side}
            className="pk-label"
          >
            {city.name} <tspan className="pk-temp">{formatTemp(temp, units)}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
