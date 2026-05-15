import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

const STOREFRONT_URL = process.env.STOREFRONT_URL ?? "http://localhost:8000";

export default defineConfig({
  globalSetup: "./playwright/global-setup.ts",
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: STOREFRONT_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    storageState: "playwright/.auth/user.json",
  },
  projects: [
    {
      name: "chromium",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "api",
      testDir: "./tests/api",
      use: {
        baseURL: process.env.ZOTOSHOP_API_URL,
        extraHTTPHeaders: {
          "x-publishable-api-key": process.env.ZOTOSHOP_PUBLISHABLE_KEY ?? "",
        },
      },
    },
    // { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
    // { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
});
