import { test, expect } from "../fixtures/page.fixture";

test.describe("@regression @smoke Store page - POM", () => {
  test("@regression @smoke store affiche au moins un produit", async ({
    storePage,
  }) => {
    await storePage.goto();
    await storePage.expectOneProductIsVisible();
  });

  test("@regression @smoke le premier produit a un prix positif", async ({
    storePage,
  }) => {
    await storePage.goto();
    await storePage.expectPositivePrice();
  });

  test("@regression cliquer sur un produit ouvre la page produit", async ({
    storePage,
    page,
  }) => {
    await storePage.goto();
    await storePage.clickOnFirstProduct();
    expect(storePage.isOnStorePage()).toBe(false);
    // On vérifie qu'on est sur une page produit avec un slug (ex: /fr/products/zotopad-controller)
    expect(page).toHaveURL(/\/fr\/products\/[a-z0-9-]+/);
    // Assertions à faire sur la page produit (à implémenter dans ProductPage)
  });

  test("on est bien sur la page store", async ({ storePage }) => {
    await storePage.goto();
    const isOnStorePage = storePage.isOnStorePage();
    expect(isOnStorePage).toBe(true);
  });

  test("le store affiche au moins un produit avec un prix positif", async ({
    storePage,
  }) => {
    await storePage.goto();
    await storePage.expectOneProductIsVisible();
    await storePage.expectPositivePrice();
  });

  test("le store affiche au moin 3 produits", async ({ storePage, page }) => {
    await storePage.goto();
    await storePage.expectOneProductIsVisible();

    const productWrappers = page.getByTestId("product-wrapper");
    const productCount = await productWrappers.count();
    expect(productCount).toBeGreaterThanOrEqual(3);
  });

  test("Consommer les 3 fixtures dans mes tests", async ({
    storePage,
    testUser,
    apiClient,
  }) => {
    // Utiliser la fixture storePage pour aller sur la page d'accueil
    await storePage.goto();

    // Utiliser la fixture apiClient pour faire une requête API (ex: récupérer les détails d'un produit)
    const response = await apiClient.get("/fr/store");
    expect(response.ok()).toBe(true);

    // Utiliser la fixture testUser pour afficher l'email de l'utilisateur de test
    console.log("Email du test user :", testUser.email);
  });
  test("Consommer les 3 fixtures dans mes tests 2", async ({
    storePage,
    testUser,
    apiClient,
  }) => {
    // Utiliser la fixture storePage pour aller sur la page d'accueil
    await storePage.goto();

    // Utiliser la fixture apiClient pour faire une requête API (ex: récupérer les détails d'un produit)
    const response = await apiClient.get("/fr/store");
    expect(response.ok()).toBe(true);
  });
  test("Consommer les 3 fixtures dans mes tests 3", async ({
    storePage,
    testUser,
    apiClient,
  }) => {
    // Utiliser la fixture storePage pour aller sur la page d'accueil
    await storePage.goto();

    // Utiliser la fixture apiClient pour faire une requête API (ex: récupérer les détails d'un produit)
    const response = await apiClient.get("/fr/store");
    expect(response.ok()).toBe(true);
  });
});
