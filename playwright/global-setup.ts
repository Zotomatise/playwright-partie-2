import { chromium, FullConfig } from "@playwright/test";
import { loginUi } from "../tests/helpers/auth-ui";
async function globalSetup(_config: FullConfig): Promise<void> {
  const email = process.env.ZOTOSHOP_TEST_EMAIL;
  const password = process.env.ZOTOSHOP_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Variables manquantes : ZOTOSHOP_TEST_EMAIL et ZOTOSHOP_TEST_PASSWORD dans .env",
    );
  }

  // 1. Lancer le navigateur
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // 2. Login via le formulaire UI (helper de L2)
  await loginUi(page, email, password);

  // 3. Sauvegarder l'état pour tous les tests
  await context.storageState({ path: "playwright/.auth/user.json" });
  await browser.close();

  console.log("Global setup completed.");
}

export default globalSetup;
