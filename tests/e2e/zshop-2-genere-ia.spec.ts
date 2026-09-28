import { test } from "@playwright/test";
import { StorePage } from "@pages/StorePage";

test.describe("ZSHOP-2 — Le prix de chaque produit est affiché", () => {
  let storePage: StorePage;

  test.beforeEach(async ({ page }) => {
    storePage = new StorePage(page);
    await storePage.goto();
  });

  test("@smoke AC1 : la boutique affiche au moins un produit", async () => {
    await storePage.expectOneProductIsVisible();
  });

  test("@smoke AC2 : le premier produit a un prix strictement positif", async () => {
    await storePage.expectPositivePrice();
  });
});
