import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const problems: string[] = [];

test.beforeEach(async ({ page }) => {
  problems.length = 0;
  page.on("pageerror", (error) => problems.push(error.message));
  // Script errors and Content Security Policy violations are logged as console errors.
  page.on("console", (message) => {
    // A deliberate 404 page logs its own status; that's expected, not a bug.
    if (message.type() === "error" && !message.text().includes("status of 404")) problems.push(message.text());
  });
});

test.afterEach(() => {
  expect(problems, "errors in the browser console").toEqual([]);
});

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

test.describe("weather", () => {
  test("the home page shows the whole country", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Pakistan weather today" })).toBeVisible();
    await expect(page.getByText("Hottest now")).toBeVisible();
    await expect(page.getByText("Coldest now")).toBeVisible();
    await expect(page.getByText("Worst air now")).toBeVisible();
    await expect(page.getByRole("img", { name: /temperature right now in 50 cities/ })).toBeVisible();
    await expect(page.locator(".pk-dot")).toHaveCount(50);
    // Every city is one click from the home page, so crawlers can reach them all.
    await expect(page.locator(".province-card li a")).toHaveCount(50);
  });

  test("a city page has the forecast, its climate and its neighbours", async ({ page }) => {
    await page.goto("/weather/islamabad");
    await expect(page.getByRole("heading", { level: 1, name: "Islamabad weather" })).toBeVisible();
    await expect(page.getByText("اسلام آباد کا موسم")).toBeVisible();
    await expect(page.locator(".hero-temp")).toHaveText("24°");
    await expect(page.locator(".hourly li")).toHaveCount(8);
    await expect(page.locator(".daily li")).toHaveCount(5);
    await expect(page.locator(".detail-value").getByText(/^AQI \d+/)).toBeVisible();
    await expect(page.locator(".page")).toHaveAttribute("data-sky", "clear");
    await expect(page.getByRole("heading", { name: "Islamabad climate" })).toBeVisible();
    await expect(page.locator(".climate-table tbody tr")).toHaveCount(12);
    await expect(page.locator('.climate-table tr[aria-current="true"]')).toHaveCount(1);
    await expect(page.getByText("What is the hottest month in Islamabad?")).toBeVisible();
    await expect(page.locator(".city-grid a").first()).toHaveAttribute("href", "/weather/rawalpindi");
  });

  test("rainfall stays hidden where the climate model overstates it", async ({ page }) => {
    await page.goto("/weather/gilgit");
    await expect(page.locator(".climate-table tbody tr")).toHaveCount(12);
    await expect(page.getByRole("columnheader", { name: "Rain" })).toHaveCount(0);
    await expect(page.getByText(/Rainfall isn't shown/)).toBeVisible();
  });

  test("province pages list their cities", async ({ page }) => {
    await page.goto("/pakistan/sindh");
    await expect(page.getByRole("heading", { level: 1, name: "Sindh weather today" })).toBeVisible();
    await expect(page.locator(".city-grid a")).toHaveCount(8);
    await page.locator(".city-grid").getByRole("link", { name: /Karachi/ }).click();
    await expect(page).toHaveURL(/\/weather\/karachi$/);
    await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Sindh" })).toBeVisible();
  });

  test("the air quality page ranks every city, worst first", async ({ page }) => {
    await page.goto("/air-quality");
    await expect(page.getByRole("heading", { level: 1, name: "Pakistan air quality today" })).toBeVisible();
    await expect(page.locator(".aqi-table tbody tr")).toHaveCount(50);
    const readings = (await page.locator(".aqi-value").allTextContents()).map(Number);
    expect(readings).toEqual([...readings].sort((a, b) => b - a));
    await expect(page.getByRole("heading", { name: "Smog season in Pakistan" })).toBeVisible();
  });

  test("the about page explains the sources", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1, name: "About Skycast" })).toBeVisible();
    await expect(page.getByText(/ERA5 reanalysis/)).toBeVisible();
  });

  test("city pages switch to Fahrenheit and keep the city", async ({ page }) => {
    await page.goto("/weather/lahore");
    await expect(page.getByRole("heading", { level: 1, name: "Lahore" })).toBeVisible();
    const celsius = Number((await page.locator(".hero-temp").textContent())!.replace("°", "").replace("−", "-"));
    await page.getByRole("link", { name: "°F" }).click();
    await expect(page).toHaveURL(/\/weather\/lahore\?units=imperial$/);
    const fahrenheit = Number((await page.locator(".hero-temp").textContent())!.replace("°", "").replace("−", "-"));
    // Both readings are rounded from the same value, so they agree to within a degree.
    expect(Math.abs(fahrenheit - (celsius * 9) / 5 - 32)).toBeLessThanOrEqual(1);
    await expect(page.getByText(/mph/).first()).toBeVisible();
    // Links to other cities keep °F.
    await expect(page.locator(".city-grid a").first()).toHaveAttribute("href", /units=imperial/);
  });

  test("searches with suggestions and the keyboard", async ({ page }) => {
    await page.goto("/");
    const box = page.getByRole("combobox", { name: "Search for a city" });
    const options = page.getByRole("option");

    // Cities we cover have their own page, and Hyderabad means the one in Sindh.
    await box.fill("Hyd");
    await expect(options).toHaveCount(1);
    await expect(options.first()).toContainText("Sindh");
    await box.press("Enter");
    await expect(page).toHaveURL(/\/weather\/hyderabad$/);

    // Anywhere else in the world still works, by coordinates.
    await box.fill("Lon");
    await expect(options).toHaveCount(2);
    await expect(options.first()).toHaveAttribute("aria-selected", "true");
    await box.press("ArrowDown");
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    await box.press("Enter");
    await expect(page).toHaveURL(/lat=42.983/);
    await expect(page.getByText("Ontario, CA")).toBeVisible();

    // Places are remembered and offered next time.
    await box.focus();
    await expect(page.getByText("Recent")).toBeVisible();
    await expect(page.getByRole("option", { name: /London/ })).toHaveCount(1);
    await expect(page.getByRole("option", { name: /Hyderabad/ })).toHaveCount(1);
  });

  test("searches in Urdu", async ({ page }) => {
    await page.goto("/");
    const box = page.getByRole("combobox", { name: "Search for a city" });
    await box.fill("لاہور");
    await expect(page.getByRole("option")).toHaveCount(1);
    await box.press("Enter");
    await expect(page).toHaveURL(/\/weather\/lahore$/);
  });

  test("works without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("combobox", { name: "Search for a city" }).fill("Lahore");
    await page.getByRole("combobox", { name: "Search for a city" }).press("Enter");
    await expect(page).toHaveURL(/\/weather\/lahore$/);
    await expect(page.getByRole("heading", { level: 1, name: "Lahore" })).toBeVisible();

    await page.goto("/");
    await page.getByRole("combobox", { name: "Search for a city" }).fill("Tokyo");
    await page.getByRole("combobox", { name: "Search for a city" }).press("Enter");
    await expect(page).toHaveURL(/q=Tokyo/);
    await expect(page.getByRole("heading", { level: 1, name: "Tokyo" })).toBeVisible();
    await context.close();
  });

  test("explains when a city isn't found", async ({ page }) => {
    await page.goto("/?q=Atlantis");
    await expect(page.getByRole("heading", { name: /No place called/ })).toBeVisible();
  });

  test("uses the reader's location when allowed", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 31.5656, longitude: 74.3142 });
    await page.goto("/");
    await page.getByRole("button", { name: "Use my location" }).click();
    await expect(page).toHaveURL(/\/weather\/lahore$/);
    await expect(page.getByRole("heading", { level: 1, name: "Lahore" })).toBeVisible();
  });

  test("has no horizontal scrolling on small screens", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    for (const path of ["/", "/weather/dera-ismail-khan", "/pakistan/khyber-pakhtunkhwa", "/air-quality", "/about", "/weather/nowhere"]) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(320);
    }
  });

  test("a skip link jumps to the forecast", async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard navigation is a desktop concern");
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to the forecast" });
    await expect(skip).toBeFocused();
    await skip.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });
});

test.describe("accessibility", () => {
  for (const path of ["/", "/weather/lahore", "/weather/gilgit", "/pakistan/punjab", "/air-quality", "/about", "/?q=Tokyo", "/?q=Atlantis", "/weather/nowhere"]) {
    test(`no serious WCAG 2.1 AA issues on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expectAccessible(page);
    });
  }

  test("no serious issues with search suggestions open", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("combobox", { name: "Search for a city" }).fill("Lon");
    await expect(page.getByRole("option")).toHaveCount(2);
    await expectAccessible(page);
  });
});

test.describe("SEO", () => {
  test("home page targets Pakistan weather", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Pakistan Weather Today: Live Forecast for 50 Cities · Skycast");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Live Pakistan weather/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://getskycast.vercel.app");
    await expect(page.locator("html")).toHaveAttribute("lang", "en-PK");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_PK");
    const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(data["@graph"].map((item: { "@type": string }) => item["@type"])).toEqual(["WebSite", "WebApplication"]);
  });

  test("every kind of page has its own title, canonical URL and social card", async ({ page }) => {
    const pages = [
      ["/weather/lahore", "Lahore Weather Today: Hourly & 5-Day Forecast · Skycast"],
      ["/pakistan/punjab", "Punjab Weather Today: Live Forecast by City · Skycast"],
      ["/air-quality", "Pakistan AQI Today: Live Air Quality by City · Skycast"],
      ["/about", "About and Data Sources · Skycast"],
    ];
    for (const [path, title] of pages) {
      await page.goto(path);
      await expect(page, path).toHaveTitle(title);
      await expect(page.locator('link[rel="canonical"]'), path).toHaveAttribute("href", `https://getskycast.vercel.app${path}`);
      await expect(page.locator('meta[name="robots"]'), path).toHaveCount(0);
      await expect(page.locator('meta[property="og:title"]'), path).toHaveAttribute("content", title);
      await expect(page.locator('meta[property="og:site_name"]'), path).toHaveAttribute("content", "Skycast");
      await expect(page.locator('meta[name="twitter:title"]'), path).toHaveAttribute("content", title);
    }
  });

  test("city pages describe the place in structured data", async ({ page }) => {
    await page.goto("/weather/lahore");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /لاہور کا موسم/);
    const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    const [, webPage, crumbs] = data["@graph"];
    expect(webPage.about["@type"]).toBe("City");
    expect(webPage.about.alternateName).toBe("لاہور");
    expect(webPage.about.geo.latitude).toBe(31.566);
    expect(webPage.about.containedInPlace.name).toBe("Punjab");
    expect(crumbs.itemListElement.map((item: { name: string }) => item.name)).toEqual(["Pakistan", "Punjab", "Lahore"]);
  });

  test("lookups and the °F view stay out of the index", async ({ page }) => {
    for (const path of ["/?q=Tokyo", "/?lat=51.5&lon=-0.12", "/?units=imperial", "/weather/lahore?units=imperial", "/pakistan/sindh?units=imperial"]) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]'), path).toHaveAttribute("content", /noindex/);
    }
  });

  test("searching for a listed city redirects to its page and keeps the units", async ({ request }) => {
    const plain = await request.get("/?q=Lahore", { maxRedirects: 0 });
    expect(plain.status()).toBe(307);
    expect(plain.headers().location).toMatch(/\/weather\/lahore$/);
    const imperial = await request.get("/?q=karachi&units=imperial", { maxRedirects: 0 });
    expect(imperial.headers().location).toMatch(/\/weather\/karachi\?units=imperial$/);
  });

  test("old world city pages redirect to a search", async ({ request }) => {
    const response = await request.get("/weather/new-york", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toMatch(/\/\?q=New\+York$/);
  });

  test("every link on the home page works", async ({ page, request }) => {
    await page.goto("/");
    const hrefs = await page.locator('main a[href^="/"], footer a[href^="/"], .regions a[href^="/"]').evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")!),
    );
    const unique = [...new Set(hrefs)];
    expect(unique.length).toBeGreaterThan(55);
    for (const href of unique) expect((await request.get(href)).status(), href).toBe(200);
  });

  test("keeps the Google Search Console verification file", async ({ request }) => {
    // Removing this file loses ownership of the site in Search Console.
    const response = await request.get("/google4adfdcaade9a40a0.html");
    expect(response.status()).toBe(200);
    expect((await response.text()).trim()).toBe("google-site-verification: google4adfdcaade9a40a0.html");
  });

  test("unknown cities return a real 404", async ({ request }) => {
    expect((await request.get("/weather/atlantis")).status()).toBe(404);
    expect((await request.get("/pakistan/atlantis")).status()).toBe(404);
    expect((await request.get("/no-such-page")).status()).toBe(404);
  });

  test("serves sitemap, robots, manifest, icons and social images", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/weather/skardu</loc>");
    expect(sitemap).toContain("/pakistan/balochistan</loc>");
    expect(sitemap).toContain("/air-quality</loc>");
    expect(sitemap.match(/<loc>/g)?.length).toBe(59);

    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Sitemap:");

    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest.short_name).toBe("Skycast");
    expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toContain("512x512");

    for (const path of [
      "/opengraph-image",
      "/weather/skardu/opengraph-image",
      "/pakistan/sindh/opengraph-image",
      "/air-quality/opengraph-image",
      "/apple-icon",
      "/pwa-icon/192",
      "/pwa-icon/512",
    ]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      expect(response.headers()["content-type"], path).toBe("image/png");
    }
  });
});

test.describe("security", () => {
  // A prerendered page can't carry the nonce, so the policy would block all of its scripts.
  for (const path of ["/", "/weather/lahore", "/pakistan/punjab", "/air-quality", "/about"]) {
    test(`${path} carries the CSP nonce on its scripts`, async ({ request }) => {
      const response = await request.get(path);
      const nonce = /'nonce-([^']+)'/.exec(response.headers()["content-security-policy"])?.[1];
      expect(nonce).toBeTruthy();
      expect(await response.text()).toContain(`nonce="${nonce}"`);
    });
  }

  test("sends a strict security policy and keeps the key off the page", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["content-security-policy"]).toContain("script-src 'self' 'nonce-");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["permissions-policy"]).toContain("geolocation=(self)");
    expect(headers["x-powered-by"]).toBeUndefined();
    expect(await response.text()).not.toContain("appid");
  });

  test("the places API validates input", async ({ request }) => {
    expect((await request.get("/api/places?q=x")).status()).toBe(400);
    expect((await request.get(`/api/places?q=${"a".repeat(81)}`)).status()).toBe(400);
    const ok = await request.get("/api/places?q=Tok");
    expect(ok.status()).toBe(200);
    expect((await ok.json()).places[0].name).toBe("Tokyo");
    expect(ok.headers()["cache-control"]).toContain("s-maxage");
  });
});
