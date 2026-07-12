//test playwright sur la page store pour vérifier le prix des affiches
// verifier que le prix de chaque produit est affiché et non vide
// reutililiser la page storePage.ts pour les actions et assertions

import { StorePage } from "@pages/StorePage";
import { test, expect } from "playwright/test";

// pas de selecteurs en dur. Locators semantiques uniquement.
test.describe("Store Page - Prix des affiches", () => {
  test("Vérifier que le prix de chaque produit est affiché et non vide", async ({
    page,
  }) => {
    const storePage = new StorePage(page);
    await storePage.goto();
    await storePage.expectOneProductIsVisible();

    const products = await storePage.getProducts();
    for (const product of products) {
      const priceLocator = product.getByTestId("price");
      await expect(priceLocator).toBeVisible();
      const priceText = await priceLocator.textContent();
      expect(priceText).not.toBeNull();
      expect(priceText?.trim()).not.toBe("");
    }
  });
});
