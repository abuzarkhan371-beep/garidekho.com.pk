import { expect, test } from "@playwright/test";

// The current Field wrapper renders a <label> without htmlFor, so placeholders
// are the stable user-visible selectors for the credentials inputs for now.
test("sign-in page exposes the credentials form", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { level: 1, name: "Welcome back" })).toBeVisible();
  await expect(page.getByPlaceholder("you@example.com")).toHaveAttribute("type", "email");
  await expect(page.getByPlaceholder("you@example.com")).toHaveAttribute("required", "");
  await expect(page.getByPlaceholder("••••••••")).toHaveAttribute("type", "password");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /login with otp/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /create an account/i })).toBeVisible();
});

test("malformed email is rejected by the browser before submission", async ({ page }) => {
  await page.goto("/login");

  const email = page.getByPlaceholder("you@example.com");
  await email.fill("not-an-email");
  await page.getByPlaceholder("••••••••").fill("Admin@12345");

  await expect(email).toHaveJSProperty("validity.valid", false);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
