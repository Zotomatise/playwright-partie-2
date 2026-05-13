import { test, expect } from "../fixtures/page.fixture";

test("le store affiche un produit avec un prix (sans POM)", async ({
  storePage,
}) => {
  await storePage.goto();
  await storePage.expectOneProductIsVisible();
  await storePage.expectPositivePrice();
});
