import { test } from "../fixtures/page.fixture";
import { ProductPage } from "@pages/ProductPage";

test.describe("@smoke ZSHOP-1 — Ouvrir la fiche d'un produit", () => {
  test("@smoke AC1 : la boutique affiche au moins un produit", async ({
    storePage,
  }) => {
    await storePage.goto();
    await storePage.expectOneProductIsVisible();
  });

  test("@smoke AC2 : cliquer sur le premier produit ouvre sa fiche et affiche le titre", async ({
    storePage,
    page,
  }) => {
    await storePage.goto();
    await storePage.clickOnFirstProduct();
    const productPage = new ProductPage(page);
    await productPage.expectVisible();
  });
});
