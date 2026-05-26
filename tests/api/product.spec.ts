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

  test("@smoke API liste produits", async ({ request }) => {
    const response = await request.get("/store/products?limit=12");
    const body = await response.json();

    // On attache la réponse complète au rapport (HTML + Allure)
    await test.info().attach("réponse API products", {
      body: JSON.stringify(body, null, 2),
      contentType: "application/json",
    });

    expect(response.ok()).toBeTruthy();
    expect(body).toHaveProperty("products");
  });
});

// pour simuler les sharding en CI, on peut lancer les tests API en parallèle (ex: 2 workers) et utiliser l'offset pour répartir les produits à tester. Par exemple, avec 12 produits et 2 workers :
// - Worker 1 : /store/products?limit=6&offset=0 → produits 1 à 6
// - Worker 2 : /store/products?limit=6&offset=6 → produits 7 à 12
test("@smoke API détail d'un produit", async ({ request }) => {
  const response = await request.get("/store/products?limit=1");
  const body = await response.json();
  expect(response.ok()).toBeTruthy();
  expect(body.products[0]).toHaveProperty("id");
  expect(body.products[0]).toHaveProperty("title");
});

test("@smoke API liste des régions", async ({ request }) => {
  const response = await request.get("/store/regions");
  const body = await response.json();
  expect(response.ok()).toBeTruthy();
  expect(Array.isArray(body.regions)).toBeTruthy();
});

test("@smoke API check publishable key valide", async ({ request }) => {
  const response = await request.get("/store/products?limit=1");
  expect(response.status()).toBe(200);
});

test("@smoke API content-type JSON", async ({ request }) => {
  const response = await request.get("/store/products?limit=1");
  expect(response.headers()["content-type"]).toContain("application/json");
});

test("@smoke API limite param respectée", async ({ request }) => {
  const response = await request.get("/store/products?limit=3");
  const body = await response.json();
  expect(body.products.length).toBeLessThanOrEqual(3);
});

test("@smoke API count total cohérent", async ({ request }) => {
  const response = await request.get("/store/products?limit=1");
  const body = await response.json();
  expect(typeof body.count).toBe("number");
  expect(body.count).toBeGreaterThan(0);
});

test("@smoke API pagination offset 0", async ({ request }) => {
  const response = await request.get("/store/products?limit=2&offset=0");
  const body = await response.json();
  expect(response.ok()).toBeTruthy();
  expect(body.products.length).toBeLessThanOrEqual(2);
});
