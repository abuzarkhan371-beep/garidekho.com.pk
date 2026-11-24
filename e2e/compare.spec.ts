import { expect, test } from "@playwright/test";

test("compare page renders a side-by-side specification table", async ({ page }) => {
  await page.goto(
    "/compare?a=toyota-corolla-altis-18-2021-full-original-2021&b=honda-civic-rs-turbo-2022-immaculate-2022",
  );

  await expect(
    page.getByRole("heading", { level: 1, name: /compare cars side by side/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Specification comparison" }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toContainText(/price/i);
  await expect(
    page.getByRole("heading", { level: 2, name: "Try another comparison" }),
  ).toBeVisible();
});

test("compare page also supports new cars", async ({ page }) => {
  await page.goto("/compare?type=new&a=toyota-corolla&b=honda-civic");

  await expect(
    page.getByRole("heading", { level: 1, name: /compare new cars side by side/i }),
  ).toBeVisible();
  const table = page.getByRole("table");
  await expect(table).toContainText(/condition/i);
  await expect(table).not.toContainText(/mileage/i);
  await expect(
    page.getByRole("heading", { level: 2, name: "Try another comparison" }),
  ).toBeVisible();
});
