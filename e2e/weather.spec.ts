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
  test("shows the default city with current conditions and forecasts", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Islamabad" })).toBeVisible();
    await expect(page.locator(".hero-temp")).toHaveText("24°");
    await expect(page.locator(".hourly li")).toHaveCount(8);
    await expect(page.locator(".daily li")).toHaveCount(5);
    await expect(page.getByText("Moderate")).toBeVisible();
    await expect(page.locator(".page")).toHaveAttribute("data-sky", "clear");
    // The city on screen isn't repeated in "Around the world".
    await expect(page.locator(".world-now a")).toHaveCount(6);
    await expect(page.locator(".world-now").getByText("Islamabad")).toHaveCount(0);
  });

  test("city pages switch to Fahrenheit and keep the city", async ({ page }) => {
    await page.goto("/weather/london");
    await expect(page.getByRole("heading", { level: 1, name: "London" })).toBeVisible();
    const celsius = Number((await page.locator(".hero-temp").textContent())!.replace("°", "").replace("−", "-"));
    await page.getByRole("link", { name: "°F" }).click();
    await expect(page).toHaveURL(/\/weather\/london\?units=imperial$/);
    const fahrenheit = Number((await page.locator(".hero-temp").textContent())!.replace("°", "").replace("−", "-"));
    // Both readings are rounded from the same value, so they agree to within a degree.
    expect(Math.abs(fahrenheit - (celsius * 9) / 5 - 32)).toBeLessThanOrEqual(1);
    await expect(page.getByText(/mph/).first()).toBeVisible();
    // Links to other cities keep °F.
    await expect(page.locator(".world-now a").first()).toHaveAttribute("href", /units=imperial/);
  });

  test("searches with suggestions and the keyboard", async ({ page }) => {
    await page.goto("/");
    const box = page.getByRole("combobox", { name: "Search for a city" });
    await box.fill("Lon");
    const options = page.getByRole("option");
    await expect(options).toHaveCount(2);
    await expect(options.first()).toHaveAttribute("aria-selected", "true");

    // London, England has its own page; London, Ontario uses coordinates.
    await box.press("Enter");
    await expect(page).toHaveURL(/\/weather\/london$/);

    await box.fill("Lon");
    await expect(options).toHaveCount(2);
    await box.press("ArrowDown");
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    await box.press("Enter");
    await expect(page).toHaveURL(/lat=42.983/);
    await expect(page.getByText("Ontario, CA")).toBeVisible();

    // Places are remembered and offered next time.
    await box.focus();
    await expect(page.getByText("Recent")).toBeVisible();
    await expect(page.getByRole("option", { name: /London/ })).toHaveCount(2);
  });

  test("works without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("combobox", { name: "Search for a city" }).fill("Lahore");
    await page.getByRole("combobox", { name: "Search for a city" }).press("Enter");
    await expect(page).toHaveURL(/q=Lahore/);
    await expect(page.getByRole("heading", { level: 1, name: "Lahore" })).toBeVisible();
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
    for (const path of ["/", "/weather/san-francisco", "/weather/nowhere"]) {
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
  for (const path of ["/", "/weather/tokyo", "/?q=Atlantis", "/weather/nowhere"]) {
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
  test("home page has a title, description, canonical URL and structured data", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Skycast: weather forecast for any city");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /current conditions/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/$|^http[^/]*\/\/[^/]+$/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
    const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(data["@graph"].map((item: { "@type": string }) => item["@type"])).toEqual(["WebSite", "WebApplication"]);
  });

  test("city pages are indexable with their own canonical URL; lookups are not", async ({ page }) => {
    await page.goto("/weather/paris");
    await expect(page).toHaveTitle("Paris weather today · Skycast");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/weather\/paris$/);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    const crumbs = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(crumbs["@type"]).toBe("BreadcrumbList");

    await page.goto("/?q=Lahore");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await page.goto("/weather/paris?units=imperial");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("unknown cities return a real 404", async ({ request }) => {
    expect((await request.get("/weather/atlantis")).status()).toBe(404);
    expect((await request.get("/no-such-page")).status()).toBe(404);
  });

  test("serves sitemap, robots, manifest, icons and social images", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/weather/tokyo</loc>");
    expect(sitemap.match(/<loc>/g)?.length).toBe(17);

    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Sitemap:");

    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest.short_name).toBe("Skycast");

    for (const path of ["/opengraph-image", "/weather/tokyo/opengraph-image", "/apple-icon"]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      expect(response.headers()["content-type"], path).toBe("image/png");
    }
  });
});

test.describe("security", () => {
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
    expect(ok.headers()["cache-control"]).toContain("s-maxage");
  });
});
