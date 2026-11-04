import { formatTemp, tempColor } from "@/lib/format";
import type { CityNow } from "@/lib/load";
import type { Units } from "@/lib/types";

const WIDTH = 520;
const HEIGHT = 450;
const WEST = 60.6;
const EAST = 78.6; // Past the last city, to leave room for its label.
const NORTH = 37.2;
const SOUTH = 23.7;

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

const x = (lon: number) => ((lon - WEST) / (EAST - WEST)) * WIDTH;
const y = (lat: number) => ((NORTH - lat) / (NORTH - SOUTH)) * HEIGHT;

/**
 * Every city as a dot, coloured by its temperature, at its real position.
 * There's no outline on purpose: the country's shape comes from the data, so the page
 * needs no boundary files and takes no position on disputed borders.
 */
export function PakistanMap({ nation, units }: { nation: CityNow[]; units: Units }) {
  const labelled = nation.filter(({ city }) => LABELS[city.slug]);
  return (
    <svg
      className="pk-map"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Map of the temperature right now in ${nation.length} cities across Pakistan`}
    >
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
