import { APIRequestContext, test as base } from "@playwright/test";
import { StorePage } from "../pages/StorePage";
import { Cart, Product } from "../types/zotoshop";
import { ProductPage } from "@pages/ProductPage";
import { CartPage } from "@pages/CartPage";

type TestUser = {
  email: string;
  prenom: string;
  motDePasse: string;
};
// Type des fixtures qu'on ajoute (typage fort)
type MyFixtures = {
  storePage: StorePage;
  testUser: TestUser;
  loggerAuto: void;
  productPagePrete: ProductPage;
  panierAvecArticle: CartPage;
};

type MyWorkerFixtures = {
  apiClient: APIRequestContext;
};

// On étend le test natif Playwright avec nos fixtures
export const test = base.extend<MyFixtures, MyWorkerFixtures>({
  storePage: async ({ page }, use) => {
    const store = new StorePage(page);
    await use(store);
  },
  testUser: async ({}, use) => {
    // PHASE 1 — SETUP (à venir)
    const timestamp = Date.now();
    const user: TestUser = {
      email: `test-${timestamp}@zotoshop.fr`,
      prenom: "Testeur",
      motDePasse: "Pass!2026",
    };
    // PHASE 2 — USE (à venir)
    await use(user);
    // PHASE 3 — TEARDOWN (à venir)
    // Ici on pourrait supprimer l'utilisateur créé en base de données pour ne pas polluer les données de test
  },
  apiClient: [
    async ({ playwright }, use) => {
      console.log("apiClient créé pour ce worker"); // ← log SETUP
      const ctx = await playwright.request.newContext({
        baseURL: "https://zotoshop.vercel.app",
      });
      await use(ctx);
      await ctx.dispose();
      console.log("apiClient disposé pour ce worker"); // ← log TEARDOWN
    },
    { scope: "worker" }, // ← le scope dans un objet d'options
  ],
  loggerAuto: [
    async ({}, use, testInfo) => {
      // PHASE 1 — SETUP : noter l'heure de début
      const debut = Date.now();

      // PHASE 2 — USE : Playwright lance le test
      await use();

      // PHASE 3 — TEARDOWN : log la durée du test
      const duree = Date.now() - debut;
      console.log(`[${testInfo.title}] durée: ${duree} ms`);
    },
    { auto: true }, // ← rend la fixture AUTOMATIQUE
  ],
  productPagePrete: async ({ page }, use) => {
    // PHASE 1 — SETUP : on crée la page ET on navigue
    // ⚠️ cable-zotolink est le produit ZotoShop avec stock disponible
    const product = new ProductPage(page);
    await page.goto("/fr/products/cable-zotolink");

    // PHASE 2 — USE : on donne au test une page DÉJÀ prête
    await use(product);

    // PHASE 3 — TEARDOWN : rien à nettoyer ici
  },
  panierAvecArticle: async ({ productPagePrete, page }, use) => {
    // 1. La page produit est déjà prête grâce à productPagePrete (chaînage de fixtures)
    await productPagePrete.addToCart();

    // 2. Naviguer au panier
    await page.goto("/fr/cart");
    const cart = new CartPage(page);

    // 3. Donner au test un panier avec 1 article
    await use(cart);
  },
});

// On ré-exporte expect pour que les tests n'aient qu'un seul import
export { expect } from "@playwright/test";
