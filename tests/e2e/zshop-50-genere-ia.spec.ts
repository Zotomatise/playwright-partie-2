import { test } from "../fixtures/page.fixture";
import { ProductPage } from "@pages/ProductPage";

test.describe("@regression ZSHOP-50 — Afficher le prix sur la fiche produit", () => {
  test(
    "@regression AC1 : le prix du ZotoPad Controller est affiché et non vide",
    async ({ page }) => {
      const productPage = new ProductPage(page);
      await productPage.goto("zotopad-controller");
      await productPage.expectPrixPositif();
    },
  );
});
