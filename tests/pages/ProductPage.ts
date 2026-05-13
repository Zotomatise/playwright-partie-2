import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model pour la page produit ZotoShop.
 * URL pattern : /fr/products/[slug]
 *
 * Hérite de BasePage (TP M2.L2.4 : factorisation des méthodes communes).
 * Pattern 4 couches :
 *   1. Locators privés
 *   2. Navigation
 *   3. Actions métier
 *   4. Assertions encapsulées
 */
export class ProductPage extends BasePage {
  // === Couche 1 : LOCATORS PRIVÉS ===
  private readonly title: Locator;
  private readonly price: Locator;
  private readonly addToCartButton: Locator;
  private readonly variantOptions: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.locator("h1").first();
    this.price = page.getByTestId("product-price").first();
    // Sélecteur stable Medusa : data-testid="add-product-button"
    this.addToCartButton = page.getByTestId("add-product-button");
    // Boutons de sélection de variante (couleur, taille...)
    this.variantOptions = page.getByTestId("option-button");
  }

  // === Couche 2 : NAVIGATION ===
  /**
   * Navigue vers une page produit donnée par son slug et attend que la page soit prête.
   * Exemple : await productPage.goto("zotopad-controller")
   */
  async goto(slug: string): Promise<void> {
    await this.page.goto(`/fr/products/${slug}`);
    await this.attendPageToBeVisible();
  }

  // === Couche 3 : ACTIONS MÉTIER ===
  /**
   * Sélectionne la première variante disponible (couleur, taille...).
   * Médusa désactive le bouton "Ajouter au panier" tant qu'aucune variante n'est choisie.
   */
  async selectionnerPremiereVariante(): Promise<void> {
    await this.variantOptions.first().click();
  }

  /**
   * Sélectionne la première variante disponible PUIS clique sur "Ajouter au panier".
   * Le bouton est désactivé tant qu'aucune variante n'est sélectionnée.
   * Attend la fin de la requête AJAX d'ajout au panier avant de retourner.
   */
  async addToCart(): Promise<void> {
    await this.selectionnerPremiereVariante();
    await this.addToCartButton.click();
    // ⚠️ IMPORTANT : attendre que la requête AJAX d'ajout au panier se termine.
    // Sans ça, la navigation suivante peut se faire avant que le panier soit mis à jour.
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Lit le prix affiché sur la page produit et retourne sa valeur numérique.
   * Gère le cas où le prix est introuvable (null) avec un early throw.
   */
  async lirePrix(): Promise<number> {
    const texte = await this.price.textContent();
    if (texte === null) {
      throw new Error("Prix introuvable sur la page produit");
    }
    return parseFloat(texte.replace("€", "").trim());
  }

  // === Couche 4 : ASSERTIONS ENCAPSULÉES ===
  /**
   * Vérifie que la page produit est bien affichée (titre + bouton d'ajout au panier).
   */
  async expectVisible(): Promise<void> {
    await expect(this.title).toBeVisible();
    await expect(this.addToCartButton).toBeVisible();
  }

  /**
   * Vérifie que le prix affiché est strictement positif.
   */
  async expectPrixPositif(): Promise<void> {
    const prix = await this.lirePrix();
    expect(prix).toBeGreaterThan(0);
  }
}
