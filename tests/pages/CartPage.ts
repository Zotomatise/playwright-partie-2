import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model pour la page panier ZotoShop.
 * URL : /fr/cart
 *
 * Hérite de BasePage (TP M2.L2.4 : factorisation des méthodes communes).
 * Pattern 4 couches POM :
 *   1. Locators privés
 *   2. Navigation
 *   3. Actions métier
 *   4. Assertions encapsulées
 */
export class CartPage extends BasePage {
  // === Couche 1 : LOCATORS PRIVÉS ===
  private readonly checkoutButton: Locator;
  private readonly emptyCartMessage: Locator;
  private readonly cartItems: Locator;

  constructor(page: Page) {
    super(page);
    this.checkoutButton = page.getByRole("link", {
      name: /checkout|commander/i,
    });
    this.emptyCartMessage = page.getByTestId("empty-cart-message");
    // Page panier = "product-row" ("cart-item" n'existe que dans le dropdown de la nav)
    this.cartItems = page.getByTestId("product-row");
  }

  // === Couche 2 : NAVIGATION ===
  /**
   * Navigue vers la page panier et attend qu'elle soit prête.
   */
  async goto(): Promise<void> {
    await this.page.goto("/fr/cart");
    await this.attendPageToBeVisible();
  }

  // === Couche 3 : ACTIONS MÉTIER ===
  /**
   * Clique sur le bouton "Commander" pour passer au checkout.
   */
  async passerAuCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }

  // === Couche 4 : ASSERTIONS ENCAPSULÉES ===
  /**
   * Vérifie que le panier contient exactement `min` articles.
   * Assertion positive sur cart-item (data-testid) — plus robuste qu'une négation sur le message vide.
   */
  async expectHasItems(min: number = 1): Promise<void> {
    await expect(this.cartItems).toHaveCount(min, { timeout: 10_000 });
  }

  /**
   * Vérifie que le panier est vide (message "panier vide" visible).
   */
  async expectIsEmpty(): Promise<void> {
    await expect(this.emptyCartMessage).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Vérifie que le bouton "Commander" est visible (panier non vide).
   */
  async expectCheckoutBoutonVisible(): Promise<void> {
    await expect(this.checkoutButton).toBeVisible();
  }

  /**
   * Vérifie que le compteur du panier dans la navigation affiche exactement N articles.
   * Le lien nav affiche "Panier (N)" — visible depuis toutes les pages du site.
   */
  async expectCompteurNavigation(n: number): Promise<void> {
    await expect(this.page.getByTestId("nav-cart-link")).toContainText(`Panier (${n})`);
  }

  /**
   * Lit la valeur actuelle du compteur dans la navigation.
   * Utile pour vérifier une incrémentation sans supposer que le panier est vide.
   */
  async lireCompteurNavigation(): Promise<number> {
    const texte = (await this.page.getByTestId("nav-cart-link").textContent()) ?? "";
    const match = texte.match(/\((\d+)\)/);
    return match ? parseInt(match[1] ?? "0", 10) : 0;
  }
}
