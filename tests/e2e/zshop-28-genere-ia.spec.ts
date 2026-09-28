import { test } from "../fixtures/page.fixture";
import { ProductPage } from "@pages/ProductPage";
import { CartPage } from "@pages/CartPage";

test.describe("@regression ZSHOP-28 — Ajouter un produit au panier", () => {
  test(
    "@regression AC1 : cliquer sur Ajouter au panier incrémente le compteur de 1",
    async ({ page }) => {
      const cartPage = new CartPage(page);
      const productPage = new ProductPage(page);

      await productPage.goto("zotopad-controller");
      const compteurAvant = await cartPage.lireCompteurNavigation();
      await productPage.addToCart();
      await cartPage.expectCompteurNavigation(compteurAvant + 1);
    },
  );

  test(
    "@regression AC2 : le panier affiche bien le produit après ajout",
    async ({ panierAvecArticle }) => {
      await panierAvecArticle.expectHasItems(1);
    },
  );
});
