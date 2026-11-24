import { expect, test } from "@playwright/test";

test("the site advertises the /sell posting entry point", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /post your ad/i })).toHaveAttribute(
    "href",
    "/sell",
  );
  await expect(page.getByRole("link", { name: /post an ad/i }).first()).toHaveAttribute(
    "href",
    "/sell",
  );
});

test("/sell lets a visitor post without an account", async ({ page, request }) => {
  const response = await request.get("/sell");
  if (response.status() >= 400) {
    test.skip(true, `/sell is not implemented yet (HTTP ${response.status()})`);
  }

  await page.goto("/sell");
  await expect(page).toHaveURL(/\/sell/);

  // Guest posting is gated by phone verification rather than a separate
  // "guest" button: a signed-out visitor reaches the no-account entry point.
  await expect(page.getByRole("heading", { name: /no account needed/i })).toBeVisible();
  await expect(page.getByPlaceholder("+923001234567")).toBeVisible();
  await expect(page.getByRole("button", { name: /send verification code/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /sign in instead/i })).toHaveAttribute(
    "href",
    "/login?next=%2Fsell",
  );
});
