import { test, expect } from "../fixtures/page.fixture";
import { mockBoutique } from "../helpers/mock-boutique";

test.describe("Store Page — Plan TC-01 à TC-10", () => {
  test.describe("Partie 1 — Affichage des produits", () => {
    test("@smoke TC-01 — Chargement de la page boutique", async ({
      storePage,
      page,
    }) => {
      await storePage.goto();
      await expect(
        page.getByRole("heading", { name: /Tous les produits/i })
      ).toBeVisible();
      expect(page.url()).toContain("/fr/store");
    });

    test("@smoke TC-02 — Au moins un produit est affiché", async ({
      storePage,
    }) => {
      await storePage.goto();
      await storePage.expectOneProductIsVisible();
    });

    test("@regression TC-03 — Le catalogue contient au moins 3 produits", async ({
      storePage,
      page,
    }) => {
      await storePage.goto();
      const count = await page.getByTestId("product-wrapper").count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test("@smoke TC-04 — Chaque carte affiche un titre non vide", async ({
      storePage,
    }) => {
      await storePage.goto();
      await storePage.expectAllProductTitlesNonEmpty();
    });

    test("@regression TC-05 — Chaque carte affiche une image produit", async ({
      storePage,
    }) => {
      await storePage.goto();
      const products = await storePage.getProducts();
      for (const product of products) {
        const img = product.locator("img").first();
        await expect(img).toBeVisible();
        const src = await img.getAttribute("src");
        expect(src).not.toBeNull();
        expect(src).not.toBe("");
        expect(src).not.toContain("placeholder");
      }
    });

    test("@edge TC-06 — Boutique vide — état dégradé (mock API)", async ({
      page,
    }) => {
      // Le mock page.route() intercepte uniquement les requêtes émises depuis le navigateur.
      // /fr/store utilise des Server Components Next.js (fetch côté Node.js) → non interceptable.
      // /fr/products-live est un Client Component qui fait le fetch depuis le browser → mockable.
      await mockBoutique(page, { products: [], count: 0 });
      await page.goto("/fr/products-live");
      // Attendre que le spinner de chargement disparaisse (la réponse mockée est revenue)
      await page.getByTestId("loading").waitFor({ state: "hidden" });
      const count = await page.getByTestId("product-wrapper").count();
      expect(count).toBe(0);
    });
  });

  test.describe("Partie 2 — Prix", () => {
    test("@smoke TC-07 — Chaque carte affiche un prix visible", async ({
      storePage,
    }) => {
      await storePage.goto();
      const products = await storePage.getProducts();
      for (const product of products) {
        const priceLocator = product.getByTestId("price");
        await expect(priceLocator).toBeVisible();
        const priceText = await priceLocator.textContent();
        expect(priceText).not.toBeNull();
        expect(priceText?.trim()).not.toBe("");
      }
    });

    test("@smoke TC-08 — Le premier prix est strictement positif", async ({
      storePage,
    }) => {
      await storePage.goto();
      const firstPrice = await storePage.getFirstProductPrice();
      expect(firstPrice).toBeGreaterThan(0);
    });

    test("@regression TC-09 — Tous les prix sont strictement positifs", async ({
      storePage,
      page,
    }) => {
      await storePage.goto();
      const priceLocators = await page.getByTestId("price").all();
      expect(priceLocators.length).toBeGreaterThan(0);
      for (const priceLocator of priceLocators) {
        const priceText = await priceLocator.textContent();
        expect(priceText).not.toBeNull();
        const priceValue = parseFloat(
          (priceText ?? "").replace("€", "").trim()
        );
        expect(priceValue).toBeGreaterThan(0);
      }
    });

    test("@regression TC-10 — Format du prix — devise EUR", async ({
      storePage,
      page,
    }) => {
      await storePage.goto();
      const priceText = await page.getByTestId("price").first().textContent();
      expect(priceText).not.toBeNull();
      expect(priceText).toContain("€");
      // Le storefront utilise convertToLocale avec locale "en-US" → format "€29.99" (symbole avant le chiffre)
      expect(priceText?.trim()).toMatch(/^€\d+(\.\d{1,2})?$/);
    });
  });
});
