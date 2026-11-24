import { expect, test } from "@playwright/test";

test("homepage renders the hero search and featured listings section", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Garidekho/i);
  await expect(
    page.getByRole("heading", { level: 1, name: /your next ride is already here/i }),
  ).toBeVisible();
  await expect(page.getByLabel(/search everything/i)).toBeVisible();

  await expect(
    page.getByRole("heading", { level: 2, name: "Featured listings" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /view all featured/i })).toHaveAttribute(
    "href",
    "/search?featured=true",
  );
});

test("homepage shows the main sections in the requested order", async ({ page }) => {
  await page.goto("/");

  const labels = [
    "Browse Used Cars",
    "Featured listings",
    "Latest used cars",
    "Featured New Cars",
    "Car Comparison",
  ];

  const positions = await page.evaluate((wanted) => wanted.map((label) => {
    const heading = Array.from(document.querySelectorAll("h2"))
      .find((element) => element.textContent?.trim() === label);
    return {
      label,
      top: heading ? heading.getBoundingClientRect().top + window.scrollY : Number.POSITIVE_INFINITY,
    };
  }), labels);

  for (const item of positions) {
    expect(item.top, `${item.label} heading is missing`).toBeLessThan(Number.POSITIVE_INFINITY);
  }
  expect(positions.map((item) => item.top)).toEqual(
    positions.map((item) => item.top).sort((a, b) => a - b),
  );
});

test("homepage shows the sliding comparison section and final news/about block", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { level: 2, name: "Car Comparison" })).toBeVisible();
  const track = page.locator("#car-comparison-track");
  await expect(track.locator("[data-carousel-card]")).toHaveCount(4);

  const start = await track.evaluate((element) => element.scrollLeft);
  await page.getByRole("button", { name: /scroll comparison right/i }).click();
  await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeGreaterThan(start);

  await page.getByRole("tab", { name: "New cars" }).click();
  await expect(page.getByRole("tab", { name: "New cars" })).toHaveAttribute("aria-selected", "true");
  await expect(track.locator("[data-carousel-card]").first()).toContainText("Toyota Corolla");

  await expect(
    page.getByRole("heading", { level: 2, name: /latest news & about/i }),
  ).toBeVisible();
});
