import { test } from "@playwright/test";
import { ProductPage } from "@pages/ProductPage";
import { CartPage } from "@pages/CartPage";

test.describe("ZSHOP-28 — Ajouter un produit au panier", () => {
  let productPage: ProductPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    productPage = new ProductPage(page);
    cartPage = new CartPage(page);
    await productPage.goto("cable-zotolink");
  });

  test("@smoke AC1 : ajouter au panier incrémente le compteur de 1", async () => {
    const avant = await cartPage.lireCompteurNavigation();
    await productPage.addToCart();
    await cartPage.expectCompteurNavigation(avant + 1);
  });

  test("@smoke AC2 : le panier affiche le produit après ajout", async () => {
    await productPage.addToCart();
    await cartPage.goto();
    await cartPage.expectHasItems(1);
  });
});
