import test, { expect } from "playwright/test";

test.describe("Tests de connexion", () => {
  test("Get store product - lis les 5 premiers produits", async ({
    request,
  }) => {
    const response = await request.get("/store/products?limit=5");

    console.log("Response status:", response.status());
    console.log("Response body:", await response.text());

    test.expect(response).toBeOK();
    const responseBody = await response.json();
    test.expect(responseBody.products).toHaveLength(5);
    test.expect(responseBody.count).toBe(12);
    test.expect(responseBody.products[0]).toMatchObject({
      title: expect.any(String),
      description: expect.any(String),
    });

    test
      .expect(response.headers()["content-type"])
      .toContain("application/json");
    console.log("1er produit:", responseBody.products[0]?.title);
  });
});
