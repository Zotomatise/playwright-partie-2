import { test } from "../fixtures/page.fixture";
import { CartPage } from "@pages/CartPage";

test.describe("@smoke ZSHOP-28 — Ajouter un produit au panier", () => {
  test("@smoke AC1 : ajouter au panier incrémente le compteur de navigation de 1", async ({
    productPagePrete,
    page,
  }) => {
    const cart = new CartPage(page);
    const avant = await cart.lireCompteurNavigation();
    await productPagePrete.addToCart();
    await cart.expectCompteurNavigation(avant + 1);
  });

  test("@smoke AC2 : le panier affiche bien le produit après ajout", async ({
    panierAvecArticle,
  }) => {
    await panierAvecArticle.expectHasItems(1);
  });
});
