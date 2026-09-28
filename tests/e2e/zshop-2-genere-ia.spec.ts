import { test } from "../fixtures/page.fixture";

test.describe("@regression ZSHOP-2 — Le prix de chaque produit est affiché", () => {
  test(
    "@regression AC1 : la boutique affiche au moins un produit",
    async ({ storePage }) => {
      await storePage.goto();
      await storePage.expectOneProductIsVisible();
    },
  );

  test(
    "@regression AC2 : le premier produit affiché a un prix visible et positif",
    async ({ storePage }) => {
      await storePage.goto();
      await storePage.expectPositivePrice();
    },
  );
});
