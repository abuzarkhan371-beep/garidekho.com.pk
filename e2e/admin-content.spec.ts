import { expect, test, type Page } from "@playwright/test";

async function signInAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill("admin@garidekho.com.pk");
  await page.getByPlaceholder("••••••••").fill("Admin@12345");

  const [loginResponse] = await Promise.all([
    page.waitForResponse(
      (response) => response.request().method() === "POST" && response.url().includes("/login"),
      { timeout: 20_000 },
    ),
    page.getByRole("button", { name: "Sign in" }).click(),
  ]);
  await loginResponse.finished();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /Welcome back, Abuzar Khan/i })).toBeVisible({ timeout: 20_000 });
  await page.waitForLoadState("networkidle", { timeout: 20_000 });
}

test("new-car comparison renders the full admin-managed spec sheet", async ({ page }) => {
  await page.goto("/compare?type=new&a=toyota-corolla&b=honda-civic");

  for (const label of [
    "Body Type", "Dimensions (Length x Width x Height)", "Ground Clearance",
    "Transmission", "Horse Power", "Boot Space", "Kerb Weight", "Fuel Type",
    "Fuel Average km/ltr", "Seating Capacity", "Top Speed", "Tyre Size",
  ]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
});

test.describe("signed-in admin content", () => {
  // Both tests use the same demo account and a shared dev server. Serializing
  // them avoids competing login server-action redirects on the same origin.
  test.describe.configure({ mode: "serial" });

  test("admin can reach car, featured-ad and news management pages", async ({ page }) => {
    await signInAsAdmin(page);

    const adminNav = page.getByRole("navigation", { name: "Admin navigation" });

    await page.getByRole("button", { name: /Abuzar Khan/i }).click();
    await page.getByRole("menuitem", { name: "Admin Panel" }).click();
    await expect(page.getByRole("heading", { name: "Admin overview" })).toBeVisible();

    await adminNav.getByRole("link", { name: "Cars & specs" }).click();
    await expect(page.getByRole("heading", { name: "Add a new car" })).toBeVisible();
    await expect(page.getByText("Dimensions", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Catalogue/ })).toBeVisible();

    await page.getByRole("link", { name: /^Used cars/ }).click();
    await expect(page.getByRole("heading", { name: "Add a used car" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Publish used car/i })).toBeVisible();

    await adminNav.getByRole("link", { name: "Featured ads" }).click();
    await expect(page.getByRole("heading", { name: "Add a featured ad" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Add to featured/i })).toBeVisible();

    await adminNav.getByRole("link", { name: "News" }).click();
    await expect(page.getByRole("heading", { name: "Add a news article" })).toBeVisible();
    await expect(page.getByText("Upload cover photo")).toBeVisible();
  });

  test("homepage shows admin edit links to signed-in administrators", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/");

    await expect(page.locator('[data-admin-edit-link][href="/admin/featured"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-admin-edit-link][href="/admin/cars?type=used"]')).toBeVisible();
    await expect(page.locator('[data-admin-edit-link][href="/admin/cars?type=new"]').first()).toBeVisible();
    await expect(page.locator('[data-admin-edit-link][href="/admin/news"]')).toBeVisible();
  });
});
