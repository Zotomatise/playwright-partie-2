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
    // Test against desktop browsers.
    {
      name: "chromium",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "safari",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Safari"] },
    },
    // Test against mobile viewports.
    {
      name: "mobile-chrome",
      testDir: "./tests/e2e",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "mobile-safari",
      testDir: "./tests/e2e",
      use: { ...devices["iPhone 12"] },
    },
    // Test against by Tag
    {
      name: "smoke-chrome",
      testDir: "./tests/e2e",
      grep: /@smoke/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "regression-chrome",
      testDir: "./tests/e2e",
      grep: /@regression/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "nightly-chrome",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
    // Test against API
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
    {
      name: "hybride",
      testDir: "./tests/hybride",
      use: {
        baseURL: process.env.ZOTOSHOP_API_URL,
        extraHTTPHeaders: {
          "x-publishable-api-key": process.env.ZOTOSHOP_PUBLISHABLE_KEY ?? "",
        },
      },
    },
    {
      name: "mocking",
      testDir: "./tests/mocking",
      use: {
        baseURL: process.env.ZOTOSHOP_API_URL,
        extraHTTPHeaders: {
          "x-publishable-api-key": process.env.ZOTOSHOP_PUBLISHABLE_KEY ?? "",
        },
      },
    },
  ],
});
