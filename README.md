# Skycast

**Live: [getskycast.vercel.app](https://getskycast.vercel.app)**

A fast, accessible weather app built with Next.js and TypeScript. Search any city to see the current conditions, the next 24 hours and a 5-day forecast. The colour of the page follows the real sky: blue on a clear afternoon, warm at sunrise and sunset, dark at night, grey in the rain.

<p align="center">
  <img src="docs/screenshot.png" alt="Skycast on desktop showing Islamabad: 24 degrees and clear, the next 24 hours, a 5-day forecast and current details" width="72%">
  &nbsp;
  <img src="docs/screenshot-mobile.png" alt="Skycast on a phone in dark mode showing London" width="22%">
</p>

| Lighthouse | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| Mobile | 96 | 100 | 100 | 100 |
| Desktop | 100 | 100 | 100 | 100 |

## Features

- **Search any city** with suggestions as you type. Use the arrow keys and Enter, or the mouse. Recent places are remembered on your device.
- **Use my location** to get the weather where you are, after you allow it in the browser.
- **°C or °F**, with wind in km/h or mph and visibility in kilometres or miles. The choice is in the URL, so shared links keep it.
- **Next 24 hours** in 3-hour steps, with the chance of rain when it matters.
- **5-day forecast** with temperature bars on one shared scale, so warmer days are easy to spot.
- **Details**: feels-like temperature, wind direction and gusts, humidity with dew point, air quality (PM2.5), pressure, visibility, and a sunrise-to-sunset arc showing where the sun is now.
- **City pages** such as [`/weather/london`](https://getskycast.vercel.app/weather/london) for 16 cities, each with its own title, description, social image and canonical URL.
- **Around the world**: the temperature right now in six other cities, one click away.
- **Times in the city's own time zone**, not yours.
- **Works without JavaScript**: pages render on the server and search falls back to a normal form.

## Tech stack

| Area | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Components, Route Handlers, Proxy) |
| Language | TypeScript (strict) |
| UI | React 19, hand-written CSS, SVG icons drawn for this app |
| Font | Bricolage Grotesque, self-hosted from npm |
| Data | [OpenWeather](https://openweathermap.org/api) current weather, 5-day forecast, air pollution and geocoding APIs (free plan) |
| Tests | Vitest (37 unit and API tests), Playwright (38 end-to-end runs on desktop and mobile), axe-core accessibility checks |
| CI | GitHub Actions: lint, type check, unit tests, build, end-to-end tests |
| Hosting | Vercel |

## How it works

```
Browser ──▶ Next.js on Vercel ──▶ OpenWeather
            ├─ /                 home page (Server Component)
            ├─ /weather/[city]   city pages
            └─ /api/places       city suggestions for the search box
```

- **The API key stays on the server.** The browser only talks to this app. Pages and `/api/places` call OpenWeather from the server with `OPENWEATHER_API_KEY`, so the key never appears in the HTML, the JavaScript bundle or network requests.
- **Responses are cached.** Weather is cached for 10 minutes and place lookups for a week. That keeps pages fast and well inside the free plan's limits.
- **The raw API data becomes one typed `Snapshot`** in `src/lib/forecast.ts`. That code is pure functions with unit tests: each day is described by its midday weather, today's range includes the current reading, and nearly empty trailing days are dropped.

## SEO

- A unique title, description and canonical URL on every page; city pages are indexable.
- Search and coordinate lookups (`/?q=…`, `/?lat=…`) and the °F view are `noindex, follow`, so search engines see no duplicates.
- `sitemap.xml` lists the home page and every city page; `robots.txt` points to it and keeps `/api/` out.
- Open Graph and Twitter cards with generated images, one per city.
- Structured data: `WebSite` with a search action and `WebApplication` on the home page, `BreadcrumbList` on city pages.
- Web app manifest, SVG favicon and an Apple touch icon.
- Unknown city URLs return a real `404` status.

## Security and accessibility

- A strict Content Security Policy with a fresh nonce on every request (`src/proxy.ts`), plus `X-Frame-Options`, `Referrer-Policy`, HSTS and a `Permissions-Policy` that allows only geolocation.
- Google Analytics is opt-in through `GA_MEASUREMENT_ID` and loads under the same nonce-based policy. Locations from "Use my location" are rounded to about 1 km before they go into the URL.
- Input to `/api/places` is validated, and errors never echo the upstream URL (which holds the key).
- Landmarks, a skip link, a fully keyboard-operable search combobox, visible focus, text contrast of at least 4.5:1 on every sky colour, and support for reduced motion. End-to-end tests run axe-core on every page type and fail on any serious WCAG 2.1 AA issue.

## Run it locally

You need Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local      # then paste your key into .env.local
npm run dev                     # http://localhost:3000
```

Get a free API key at [openweathermap.org](https://home.openweathermap.org/api_keys). New keys can take up to two hours to start working.

No key yet? Run with the built-in sample data instead:

```bash
WEATHER_SAMPLE_DATA=1 npm run dev
```

### Environment variables

| Name | Required | What it does |
|---|---|---|
| `OPENWEATHER_API_KEY` | Yes | Your OpenWeather key. Server-side only. |
| `SITE_URL` | No | Public address for canonical links and the sitemap. Defaults to `https://getskycast.vercel.app` on Vercel and `http://localhost:3000` elsewhere. |
| `GA_MEASUREMENT_ID` | No | Google Analytics 4 measurement ID (`G-…`). When set, the Google tag loads with the page's CSP nonce and the policy allows Google's analytics hosts; when unset, nothing from Google loads. |
| `WEATHER_SAMPLE_DATA` | No | Set to `1` to use the sample data in `src/lib/fixtures`. Ignored in Vercel production. |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Build and run the production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run the TypeScript compiler |
| `npm test` | Unit and API route tests (Vitest) |
| `npm run test:e2e` | End-to-end and accessibility tests with Playwright, against the production build and sample data |

Before running `npm run test:e2e` the first time, install the browser with `npx playwright install chromium`.

## Deploy to Vercel

1. Import this repository in Vercel. It detects Next.js; there are no settings to change.
2. Add `OPENWEATHER_API_KEY` under **Settings → Environment Variables** for Production and Preview.
3. Deploy. Every push to `main` deploys again.

## Project structure

```
src/
  app/
    page.tsx                 Home page
    weather/[city]/          City pages and their social images
    api/places/route.ts      City search for the search box
    sitemap.ts, robots.ts, manifest.ts, opengraph-image.tsx, apple-icon.tsx
    layout.tsx, error.tsx, not-found.tsx, globals.css
  components/                Page layout, hero, forecasts, details, search, location and unit controls, icons
  lib/
    openweather.ts           Server-only API client (key, caching, sample data)
    load.ts                  Loading and error handling shared by the pages
    forecast.ts              Raw API data → Snapshot
    cities.ts                Cities with their own page
    conditions.ts            Weather codes, labels and sky colours
    format.ts, time.ts       Units, conversions and time zones
    query.ts, site.ts        URLs, canonical address and structured data
  proxy.ts                   Content Security Policy with nonces; 404 for unknown cities
e2e/                         Playwright tests
```

## History

This project started in 2021 as a small Create React App exercise. In 2026 it was rebuilt from scratch with Next.js and TypeScript, with the API key moved to the server.

## Credits

Weather data from [OpenWeather](https://openweathermap.org/). Built by [Muhammad Shehryar](https://github.com/Shahryartariq).

## License

[MIT](LICENSE)
