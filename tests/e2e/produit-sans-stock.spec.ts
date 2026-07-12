import { test } from "../fixtures/page.fixture";
import { ProductPage } from "@pages/ProductPage";

test.describe("@regression Fiche produit — rupture de stock", () => {
  test(
    "@regression un produit sans stock affiche 'Rupture de stock' sur sa fiche",
    async ({ storePage, page }) => {
      // Passer par le store (réutilise StorePage)
      await storePage.goto();

      // Naviguer vers la fiche du produit sans stock via la méthode de StorePage
      await storePage.allerVersFiche("cable-rupture-test");

      const productPage = new ProductPage(page);

      // Sélectionner la variante — le stock indicator n'apparaît qu'après sélection
      await productPage.selectionnerPremiereVariante();

      // Vérifier "Rupture de stock" + bouton désactivé (assertion encapsulée dans ProductPage)
      await productPage.expectRuptureDeStock();
    }
  );
});
