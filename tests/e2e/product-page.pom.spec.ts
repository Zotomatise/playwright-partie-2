import { test, expect } from "../fixtures/page.fixture";

test.describe("Page produit chargée— POM", () => {
  test("le prix du produit est affiché et positif", async ({
    productPagePrete,
  }) => {
    const prix = await productPagePrete.lirePrix();
    expect(prix).toBeGreaterThan(0);
  });

  test("la page produit est chargée et affiche les éléments essentiels", async ({
    productPagePrete,
  }) => {
    await productPagePrete.expectVisible();
    await productPagePrete.expectPrixPositif();
  });
  test.only("le panier contient bien un article après ajout depuis la page produit", async ({
    panierAvecArticle,
  }) => {
    await panierAvecArticle.expectHasItems(1);
  });
});
