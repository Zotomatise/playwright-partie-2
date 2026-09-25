import { test } from "@playwright/test";
import { StorePage } from "../pages/StorePage";
import { ProductPage } from "../pages/ProductPage";

test.describe("ZSHOP-1 — Ouvrir la fiche d'un produit", () => {
  test("AC1 - la boutique affiche au moins un produit", async ({ page }) => {
    const storePage = new StorePage(page);
    await storePage.goto();
    await storePage.expectOneProductIsVisible();
  });

  test("AC2 - cliquer sur le premier produit ouvre sa fiche et affiche un détail", async ({
    page,
  }) => {
    const storePage = new StorePage(page);
    const productPage = new ProductPage(page);

    await storePage.goto();
    await storePage.clickOnFirstProduct();
    await productPage.expectVisible();
  });
});