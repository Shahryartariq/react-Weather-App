/** The home page map's drawing area. Shared with the script that builds the outline, so they line up. */
export const MAP_WIDTH = 520;
export const MAP_HEIGHT = 428;

const WEST = 60.6;
const EAST = 79.6; // Past Jammu and Kashmir's eastern edge.
const NORTH = 37.2;
const SOUTH = 23.7;

export const mapX = (lon: number) => ((lon - WEST) / (EAST - WEST)) * MAP_WIDTH;
export const mapY = (lat: number) => ((NORTH - lat) / (NORTH - SOUTH)) * MAP_HEIGHT;
