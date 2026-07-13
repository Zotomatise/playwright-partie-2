import { test } from "../fixtures/page.fixture";
import { CartPage } from "@pages/CartPage";

test.describe("@regression Panier — compteur navigation", () => {
  test("@regression ajouter un produit au panier incrémente le compteur dans la navigation", async ({
    productPagePrete,
    page,
  }) => {
    const cart = new CartPage(page);

    // Lire le compteur avant ajout (robuste même si le panier contient déjà des articles)
    const avant = await cart.lireCompteurNavigation();

    // Ajouter le produit au panier (sélectionne la variante + attend networkidle)
    await productPagePrete.addToCart();

    // Vérifier que le compteur a augmenté d'exactement 1
    await cart.expectCompteurNavigation(avant + 1);
  });
});
