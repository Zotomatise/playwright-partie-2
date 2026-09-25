import { test } from "../fixtures/page.fixture";

test.describe("@smoke ZSHOP-2 — Le prix de chaque produit est affiché", () => {
  test("@smoke AC1 : la boutique affiche au moins un produit", async ({
    storePage,
  }) => {
    await storePage.goto();
    await storePage.expectOneProductIsVisible();
  });

  test("@smoke AC2 : le premier produit affiché a un prix visible et positif", async ({
    storePage,
  }) => {
    await storePage.goto();
    await storePage.expectOneProductIsVisible();
    await storePage.expectPositivePrice();
  });
});
