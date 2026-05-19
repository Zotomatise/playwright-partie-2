import { off } from "node:cluster";
import test, { expect } from "playwright/test";

test.describe("Boutique sans Mocking", () => {
  test("should display the boutique page", async ({ page }) => {
    const apiUrl =
      process.env.ZOTOSHOP_STOREFRONT_URL ?? "http://localhost:8000";
    await page.goto(`${apiUrl}/fr/products-live`);
    await page.getByTestId("product-wrapper").first().waitFor();

    const countProducts = await page.getByTestId("product-wrapper").count();

    console.log("Nombre de produits affichés :", countProducts);
    expect(countProducts).toBe(12);
  });
});

test.describe("Boutique avec Mocking", () => {
  test("should display the boutique page with mocked data", async ({
    page,
  }) => {
    await page.route("**/store/products?**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          products: [
            {
              id: "mocked-product-1",
              name: "Mocked Product 1",
              price: 19.99,
              imageUrl: "https://via.placeholder.com/150",
            },
            {
              id: "mocked-product-2",
              name: "Mocked Product 2",
              price: 29.99,
              imageUrl: "https://via.placeholder.com/150",
            },
          ],
          count: 2,
          offset: 0,
          limit: 12,
        }),
      });
    });

    const apiUrl =
      process.env.ZOTOSHOP_STOREFRONT_URL ?? "http://localhost:8000";
    await page.goto(`${apiUrl}/fr/products-live`);
    await page.getByTestId("product-wrapper").first().waitFor();

    const countProducts = await page.getByTestId("product-wrapper").count();

    console.log("Nombre de produits affichés (mocked) :", countProducts);
    expect(countProducts).toBe(2);
  });
});

test.describe("Route continue avec Mocking et delay", () => {
  test("should display the boutique page with mocked data and delay", async ({
    page,
  }) => {
    await page.route("**/store/products?**", async (route) => {
      console.log("Intercepte : ", route.request().url());
      await route.continue();
    });
    const apiUrl =
      process.env.ZOTOSHOP_STOREFRONT_URL ?? "http://localhost:8000";
    await page.goto(`${apiUrl}/fr/products-live`);
    await page.getByTestId("product-wrapper").first().waitFor();

    const countProducts = await page.getByTestId("product-wrapper").count();

    console.log("Nombre de produits affichés (continue) :", countProducts);
    expect(countProducts).toBe(12);
  });
});
