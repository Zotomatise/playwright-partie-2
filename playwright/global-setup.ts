import { chromium, FullConfig } from "@playwright/test";
import { loginUi } from "../tests/helpers/auth-ui";
async function globalSetup(_config: FullConfig): Promise<void> {
  const email = process.env.ZOTOSHOP_TEST_EMAIL;
  const password = process.env.ZOTOSHOP_TEST_PASSWORD;

  if (!email || !password) {
    //  Mode "graceful degradation" : si les creds ne sont pas dispo (ex : CI sans
    // GitHub Secrets configurés — voir M9.L3), on skippe le login UI proprement.
    // Les tests qui dépendent de storageState échoueront, mais les projects
    // sans auth (ex : smoke-api) tourneront sans souci.
    console.warn(
      "ZOTOSHOP_TEST_EMAIL/PASSWORD non définis — global-setup skippé. " +
        "Voir M9.L3 pour configurer les GitHub Secrets.",
    );
    return;
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
