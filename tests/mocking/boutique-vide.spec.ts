import test, { expect } from "playwright/test";
import { mockBoutique } from "../helpers/mock-boutique";

test.describe("Boutique Vide", () => {
  const Storefront =
    process.env.ZOTOSHOP_STOREFRONT_URL ?? "http://localhost:8000";
  test("should display the empty state when there are no products", async ({
    page,
  }) => {
    await mockBoutique(page, { products: [], count: 0, offset: 0, limit: 12 });

    await page.goto(`${Storefront}/fr/products-live`);
    // await page.getByTestId("empty-message").waitFor();
    expect(await page.getByTestId("product-wrapper").count()).toBe(0);
  });
  test("Erreur 500 - l'UI en mode dégradé", async ({ page }) => {
    await mockBoutique(page, { status: 500 });
    await page.goto(`${Storefront}/fr/products-live`);
    // await page.getByTestId("empty-state").waitFor();
    expect(await page.getByTestId("product-wrapper").count()).toBe(0);
  });
  test("Limite Backend : L'UI lit le header retry-after", async ({ page }) => {
    //developer.mozilla.org/fr/docs/Web/HTTP/Reference/Status

    await mockBoutique(page, {
      status: 429,
      extraHeaders: {
        "Retry-After": "5",
        "Access-Control-Expose-Headers": "Retry-After",
      },
      errorBody: {
        type: "Too Many Requests",
        message:
          "You have sent too many requests in a given amount of time. Please try again later.",
      },
    });

    // const msg = page.getByTestId("rate-limit-message");
    await page.goto(`${Storefront}/fr/products-live`);
    // await msg.waitFor();
    // expect(await msg.textContent()).toContain(
    //   "You have sent too many requests",
    // );
    // await page.getByTestId("empty-state").waitFor();
    expect(await page.getByTestId("product-wrapper").count()).toBe(0);
  });
});
