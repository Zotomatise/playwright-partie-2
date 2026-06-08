import { expect, Page } from "playwright/test";

export async function loginUi(page: Page, email: string, password: string) {
  await page.goto("https://zotoshop.vercel.app/fr/account");
  await page.getByTestId("email-input").fill(email);
  await page.getByTestId("password-input").fill(password);
  await page.getByTestId("sign-in-button").click();
  // On attend que le formulaire de login disparaisse (le bouton "se connecter"
  // n'existe plus), preuve réelle que la requête de login a abouti. La page
  // /fr/account ne redirige pas après login, donc une assertion d'URL résoudrait
  // instantanément AVANT l'arrivée du cookie de session _medusa_jwt — et
  // global-setup sauvegarderait un storageState incomplet (cf. bug M9).
  await expect(page.getByTestId("sign-in-button")).toHaveCount(0);
}
