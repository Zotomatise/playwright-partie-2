import { test, expect } from "@playwright/test";
import { StorePage } from "../pages/StorePage";
import { ProductPage } from "../pages/ProductPage";

test.describe("ZSHOP-1 — Ouvrir la fiche d'un produit", () => {
  let storePage: StorePage;
  let productPage: ProductPage;

  test.beforeEach(async ({ page }) => {
    storePage = new StorePage(page);
    productPage = new ProductPage(page);
    await storePage.goto();
  });

  test("ZSHOP-1 AC1 - la boutique affiche au moins un produit", async () => {
    await storePage.expectOneProductIsVisible();
  });

  test("ZSHOP-1 AC2 - cliquer sur le premier produit ouvre sa fiche et affiche un détail", async ({
    page,
  }) => {
    await storePage.clickOnFirstProduct();

    // Vérifier que l'URL correspond au pattern /fr/products/...
    expect(page.url()).toMatch(/\/fr\/products\/[a-z0-9-]+/);

    // Vérifier que la fiche produit est visible avec ses détails
    await productPage.expectVisible();
  });
});