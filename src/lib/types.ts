/** Units the reader picked. Data is always fetched in metric and converted for display. */
export type Units = "metric" | "imperial";

/** Weather conditions, grouped the way people talk about them. */
export type Condition =
  | "clear"
  | "partly"
  | "clouds"
  | "drizzle"
  | "rain"
  | "thunder"
  | "snow"
  | "mist";

/** The colour of the page's sky band. */
export type Sky = "clear" | "partly" | "clouds" | "rain" | "storm" | "snow" | "mist" | "dawn" | "dusk" | "night";

export interface Place {
  name: string;
  region?: string;
  country: string;
  lat: number;
  lon: number;
}

export interface HourSlot {
  /** Unix seconds (UTC). */
  time: number;
  temp: number;
  condition: Condition;
  isDay: boolean;
  /** Chance of precipitation, 0–1. */
  pop: number;
}

export interface DaySummary {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  min: number;
  max: number;
  condition: Condition;
  /** Highest chance of precipitation that day, 0–1. */
  pop: number;
}

export interface AirQuality {
  /** OpenWeather's European AQI band, 1 (good) to 5 (very poor). */
  index: 1 | 2 | 3 | 4 | 5;
  pm25: number;
  pm10: number;
}

/** Everything the page needs, in metric units. */
export interface Snapshot {
  place: Place;
  /** Seconds east of UTC for the place. */
  timezoneOffset: number;
  observedAt: number;
  current: {
    temp: number;
    feelsLike: number;
    high: number;
    low: number;
    condition: Condition;
    description: string;
    humidity: number;
    pressure: number;
    /** m/s */
    windSpeed: number;
    /** m/s */
    windGust?: number;
    windDeg: number;
    /** metres */
    visibility: number;
    clouds: number;
    sunrise: number;
    sunset: number;
    isDay: boolean;
  };
  hourly: HourSlot[];
  daily: DaySummary[];
  air?: AirQuality;
}

/* ---- Raw OpenWeather responses (only the fields we use) ---- */

export interface OWWeatherItem {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface OWCurrent {
  dt: number;
  timezone: number;
  name: string;
  sys: { country?: string; sunrise: number; sunset: number };
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: OWWeatherItem[];
  wind: { speed: number; deg: number; gust?: number };
  clouds: { all: number };
  visibility?: number;
}

export interface OWForecastItem {
  dt: number;
  main: { temp: number; temp_min: number; temp_max: number };
  weather: OWWeatherItem[];
  pop?: number;
  sys?: { pod?: "d" | "n" };
}

export interface OWForecast {
  list: OWForecastItem[];
  city: { timezone: number; sunrise: number; sunset: number };
}

export interface OWAir {
  list: { main: { aqi: number }; components: { pm2_5: number; pm10: number } }[];
}

export interface OWGeoResult {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}
