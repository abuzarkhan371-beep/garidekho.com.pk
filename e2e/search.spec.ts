import { expect, test } from "@playwright/test";

test("filtered search shows active filters and matching listings", async ({ page }) => {
  await page.goto("/search?make=toyota&city=lahore&maxPrice=6000000");

  await expect(page).toHaveURL(/\/search\?/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "All vehicles for sale",
  );
  await expect(page.getByText("Active filters:")).toBeVisible();
  await expect(page.getByRole("link", { name: /brand: toyota/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /city: lahore/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /max price: PKR 6,000,000/i })).toBeVisible();

  // The seed data contains a Toyota in Lahore, so at least one card is expected.
  await expect(page.getByRole("article").first()).toBeVisible();
  await expect(page.getByText(/vehicles? found across Pakistan/)).toBeVisible();
});

test("a search with no matches renders the empty state", async ({ page }) => {
  await page.goto("/search?q=zzz-no-such-vehicle-999");

  await expect(page.getByRole("heading", { level: 1, name: /results for/i })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No vehicles matched your search" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /clear all filters/i })).toHaveAttribute(
    "href",
    "/search",
  );
});
