import { test, expect } from "playwright/test";

test.describe("Tests de connexion", () => {
  test("@smoke devrait être connecté grâce au global setup", async ({
    page,
  }) => {
    await page.goto("/fr");
    await page.getByTestId("nav-account-link").click();
    // Le bouton "Déconnexion" n'apparaît que sur un compte connecté : c'est la
    // preuve que le storageState du global setup nous a bien authentifiés.
    await expect(page.getByRole("button", { name: "Déconnexion" })).toBeVisible();
  });
  test("@smoke déjà connecté à zotoshop et panier accessible", async ({
    page,
  }) => {
    await page.goto("/fr");
    await page.getByTestId("nav-cart-link").click();
    await expect(
      page.getByRole("heading", { name: "Panier", level: 1 }),
    ).toBeVisible();
  });

  test("@smoke déjà connecté à zotoshop et store accessible", async ({
    page,
  }) => {
    await page.goto("/fr");
    await page.getByRole("link", { name: "Découvrir nos produits" }).click();
    await expect(
      page.getByRole("heading", { name: "Tous les produits" }),
    ).toBeVisible();
  });
  test("deja connecté et le bouton de connexion n'est pas visible", async ({
    page,
  }) => {
    // Si on est réellement connecté, /fr/account affiche le tableau de bord du
    // compte et plus le formulaire de login : le bouton "se connecter" a disparu.
    await page.goto("/fr/account");
    await expect(page.getByTestId("sign-in-button")).toHaveCount(0);
  });
});
