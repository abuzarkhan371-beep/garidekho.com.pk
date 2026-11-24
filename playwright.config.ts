import { defineConfig, devices } from "@playwright/test";

// The application's default local URL is http://localhost:3000
// (see NEXT_PUBLIC_SITE_URL in .env.example). E2E runs on 3100 by default so it
// does not collide with an already-running `npm run dev`. Set E2E_BASE_URL (or
// E2E_PORT) to point at a different server or at :3000 explicitly.
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`;
const port = process.env.E2E_PORT || new URL(baseURL).port || "3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // The local webpack/SWC fallback plus the login server action make parallel
  // navigation flaky. A single worker keeps this suite deterministic locally.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Keep generated absolute links consistent with the port Playwright uses.
    env: { NEXT_PUBLIC_SITE_URL: baseURL },
  },
});
