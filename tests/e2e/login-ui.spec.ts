import test, { expect } from "playwright/test";
import { loginUi } from "../helpers/auth-ui";

test("should login with valid credentials", async ({ page }) => {
  await loginUi(page, "standard_user@zotoshop.com", "password123");
});

test("se connecter à Zotoshop puis ouvrir le panier", async ({ page }) => {
  await loginUi(page, "standard_user@zotoshop.com", "password123");
  await page.getByTestId("nav-cart-link").click();
  await expect(page).toHaveURL(/.*cart$/);
});

test("se connecter à Zotoshop puis ouvrir le store", async ({ page }) => {
  await loginUi(page, "standard_user@zotoshop.com", "password123");
  await page.goto("https://zotoshop.vercel.app/fr");
  await page.getByRole("link", { name: "Découvrir nos produits" }).click();
  await expect(page).toHaveURL(/.*store$/);
});
