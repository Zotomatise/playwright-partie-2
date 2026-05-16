import test, { expect } from "playwright/test";

test.describe("Store coherence", () => {
  test("Pattern roi - Coherence UI > API", async ({ request, page }) => {
    //  Phase 1: preparation
    const apiResponse = await request.get("/store/products?limit=100");
    expect(apiResponse).toBeOK();

    const { count: apiCount } = await apiResponse.json();
    console.log(`API count: ${apiCount}`);
    // Phase 2: UI interactions
    await page.goto(`${process.env.ZOTOSHOP_STOREFRONT_URL!}/fr/store`);
    await page
      .getByTestId("product-wrapper")
      .first()
      .waitFor({ state: "visible" });

    // Phase 3 : Assertion API response
    const uiProducts = await page.getByTestId("product-wrapper").count();
    console.log(`UI count: ${uiProducts}`);
    expect(uiProducts).toBe(apiCount);
  });
  test.only("Pattern roi - Coherence affichage UI > API", async ({
    request,
    page,
  }) => {
    //  Phase 1: preparation
    const apiResponse = await request.get("/store/products?limit=1");
    expect(apiResponse).toBeOK();

    const { products: apiProducts } = await apiResponse.json();
    const apiProduct = apiProducts[0];
    console.log(
      `API product: ${apiProduct.title} (handle: ${apiProduct.handle})`,
    );

    // Phase 2: UI interactions
    await page.goto(
      `${process.env.ZOTOSHOP_STOREFRONT_URL!}/fr/products/${apiProduct.handle}`,
    );
    await page
      .getByTestId("product-title")
      .first()
      .waitFor({ state: "visible" });

    // Phase 3 : Assertion API response
    const uiTitle = await page.getByTestId("product-title").first().innerText();
    console.log(`UI product title: ${uiTitle}`);
    expect(uiTitle).toBe(apiProduct.title);
  });
});
