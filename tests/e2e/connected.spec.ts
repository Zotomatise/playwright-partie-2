import test from "playwright/test";

test.describe("Tests de connexion", () => {
  test("@smoke devrait être connecté grâce au global setup", async ({
    page,
  }) => {
    await page.goto("/fr");
    await page.getByTestId("nav-account-link").click();
    await page.getByRole("heading", { name: "Mon compte" }).isVisible();
  });
  test("@smoke déjà connecté à zotoshop et panier accessible", async ({
    page,
  }) => {
    await page.goto("/fr");
    await page.getByTestId("nav-cart-link").click();
    await page.getByRole("heading", { name: "Mon panier" }).isVisible();
  });

  test("@smoke déjà connecté à zotoshop et store accessible", async ({
    page,
  }) => {
    await page.goto("/fr");
    await page.getByRole("link", { name: "Découvrir nos produits" }).click();
    await page.getByRole("heading", { name: "Nos produits" }).isVisible();
  });
  test("deja connecté et le bouton de connexion n'est pas visible", async ({
    page,
  }) => {
    await page.goto("/fr");
    await page.getByTestId("nav-account-link").isHidden();
  });
});
