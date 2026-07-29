import { test } from "../fixtures/page.fixture";
import { CartPage } from "@pages/CartPage";

// Fixture PÉDAGOGIQUE (L5) : version CORRIGÉE de panier-mauvais.spec.ts.
// Chaque anti-pattern est remplacé par la bonne pratique Playwright + POM.

test.describe("@smoke Panier — ajout d'article", () => {
  // ✅ Anti-pattern 1 corrigé : plus de let panierId au niveau module.
  //    Chaque test reçoit ses propres fixtures Playwright → isolation totale.

  test("@smoke ajouter un produit au panier affiche le panier non vide", async ({
    panierAvecArticle, // fixture chaînée : navigue vers produit + addToCart + /fr/cart
  }) => {
    // ✅ Anti-pattern 2 corrigé : aucun waitForTimeout.
    //    La fixture panierAvecArticle attend networkidle après l'ajout au panier.
    //    L'assertion elle-même attend la visibilité via expect() auto-retry.

    // ✅ Anti-pattern 3 corrigé : sélecteur sémantique data-testid="empty-cart-message"
    //    encapsulé dans CartPage.expectHasItems() — jamais de CSS positionnel ici.

    // ✅ Anti-pattern 4 corrigé : assertion métier réelle (panier non vide)
    //    au lieu de expect(true).toBeTruthy().
    await panierAvecArticle.expectHasItems();

    // ✅ Anti-pattern 5 corrigé : aucun afterEach à écrire.
    //    Le teardown est géré par le cycle use/teardown de la fixture Playwright.
  });

  test("@smoke ajouter un produit incrémente le compteur de navigation", async ({
    productPagePrete,
    page,
  }) => {
    const cart = new CartPage(page);

    // Lire le compteur AVANT ajout pour ne pas supposer que le panier est vide.
    const avant = await cart.lireCompteurNavigation();

    // Ajouter au panier via la méthode POM (sélectionne la variante + attend networkidle).
    await productPagePrete.addToCart();

    // Assertion métier : le compteur doit augmenter de 1 exactement.
    await cart.expectCompteurNavigation(avant + 1);
  });
});
