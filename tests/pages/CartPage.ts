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

  constructor(page: Page) {
    super(page);
    this.checkoutButton = page.getByRole("link", {
      name: /checkout|commander/i,
    });
    // Quand le panier est VIDE, ce message est visible.
    // Quand il a au moins 1 article, il disparaît.
    this.emptyCartMessage = page.getByTestId("empty-cart-message");
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
   * Vérifie que le panier contient au moins un article.
   * On vérifie que le message "panier vide" n'est PAS visible.
   * (Le paramètre min est ignoré — on vérifie juste 'non vide'.)
   */
  async expectHasItems(_min: number = 1): Promise<void> {
    await expect(this.emptyCartMessage).not.toBeVisible({ timeout: 10_000 });
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
}
