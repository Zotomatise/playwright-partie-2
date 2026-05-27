import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

const STOREFRONT_URL = process.env.STOREFRONT_URL ?? "http://localhost:8000";

const isCI = !!process.env.CI;
export default defineConfig({
  globalSetup: "./playwright/global-setup.ts",
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: isCI
    ? [
        //  Mode CI — lisible par machine + partageable
        ["list"],
        ["allure-playwright", { resultsDir: "allure-results" }],
        ["blob"], // pour merger les shards en M9.L2
        ["github"], //  annotations dans les Pull Requests GitHub
        ["./reporters/team-notifs-reporter.ts"], // Notifications Teams/Slack
      ]
    : [
        // Mode local — visuel + rapide
        ["list"],
        ["html", { open: "never" }],
        [
          "allure-playwright",
          {
            resultsDir: "allure-results",
            links: {
              issue: {
                urlTemplate: "https://zotomatise.atlassian.net/browse/%s",
                nameTemplate: "Jira #%s",
              },
            },
          },
        ],
        ["./reporters/team-notifs-reporter.ts"], // Notifications Teams/Slack
      ],
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
    // 🚀 Smoke API — project CI-ready (M9.L1)
    // Pas d'auth UI requis, juste l'API publique → tourne en CI sans secrets
    // (les tests UI nécessitent les secrets vus en M9.L3).
    {
      name: "smoke-api",
      testDir: "./tests/api",
      grep: /@smoke/,
      use: {
        baseURL: process.env.ZOTOSHOP_API_URL ?? "https://api.zotomatise.com",
        extraHTTPHeaders: {
          "x-publishable-api-key": process.env.ZOTOSHOP_PUBLISHABLE_KEY ?? "",
        },
        // 🎓 Override : ce project n'a PAS besoin d'auth UI → état vide
        // explicite (undefined ne marche pas, Playwright garde l'héritage).
        storageState: { cookies: [], origins: [] },
      },
    },
    // Test against API (toute la suite)
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
