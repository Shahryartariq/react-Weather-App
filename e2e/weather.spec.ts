import { expect, test } from "@playwright/test";

const problems: string[] = [];

test.beforeEach(async ({ page }) => {
  problems.length = 0;
  page.on("pageerror", (error) => problems.push(error.message));
  // Script errors and Content Security Policy violations are logged as console errors.
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });
});

test.afterEach(() => {
  expect(problems, "errors in the browser console").toEqual([]);
});

test("shows the default city with current conditions and forecasts", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Islamabad" })).toBeVisible();
  await expect(page.locator(".hero-temp")).toHaveText("24°");
  await expect(page.locator(".hourly li")).toHaveCount(8);
  await expect(page.locator(".daily li")).toHaveCount(5);
  await expect(page.getByText("Moderate")).toBeVisible();
  await expect(page.locator(".page")).toHaveAttribute("data-sky", "clear");
});

test("switches to Fahrenheit and keeps the place", async ({ page }) => {
  await page.goto("/?lat=51.507&lon=-0.128");
  await expect(page.getByRole("heading", { level: 1, name: "London" })).toBeVisible();
  await page.getByRole("link", { name: "°F" }).click();
  await expect(page).toHaveURL(/units=imperial/);
  await expect(page).toHaveURL(/lat=51.507/);
  await expect(page.locator(".hero-temp")).toHaveText("76°");
  await expect(page.getByText(/mph/).first()).toBeVisible();
});

test("searches with suggestions and the keyboard", async ({ page }) => {
  await page.goto("/");
  const box = page.getByRole("combobox", { name: "Search for a city" });
  await box.fill("Lon");
  const options = page.getByRole("option");
  await expect(options).toHaveCount(2);
  await expect(options.first()).toHaveAttribute("aria-selected", "true");
  await box.press("ArrowDown");
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
  await box.press("Enter");
  await expect(page).toHaveURL(/lat=42.983/);
  await expect(page.getByText("Ontario, CA")).toBeVisible();

  // The place is remembered and offered next time.
  await box.focus();
  await expect(page.getByText("Recent")).toBeVisible();
  await expect(page.getByRole("option", { name: /London/ })).toBeVisible();
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
  await expect(page.getByRole("heading", { level: 1, name: "Lahore" })).toBeVisible();
});

test("sends a strict security policy and keeps the key off the page", async ({ request }) => {
  const response = await request.get("/");
  const csp = response.headers()["content-security-policy"];
  expect(csp).toContain("script-src 'self' 'nonce-");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(await response.text()).not.toContain("appid");

  const api = await request.get("/api/places?q=x");
  expect(api.status()).toBe(400);
});

test("has no horizontal scrolling on small screens", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto("/");
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(360);
});
