import { expect, Page } from "playwright/test";

export async function loginUi(page: Page, email: string, password: string) {
  await page.goto("https://zotoshop.vercel.app/fr/account");
  await page.getByTestId("email-input").fill(email);
  await page.getByTestId("password-input").fill(password);
  await page.getByTestId("sign-in-button").click();
  await expect(page).toHaveURL(/.*account$/);
}
