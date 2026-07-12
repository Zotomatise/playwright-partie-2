import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Numéros de carte bancaire simulée disponibles dans ZotoShop.
 * À utiliser avec remplirCarteBancaire() — date d'expiration : 12/26, CVC : 123.
 */
export const CARTES_TEST = {
  VALIDE: "4242424242424242",
  REFUSEE: "4000000000000002",
  FONDS_INSUFFISANTS: "4000000000009995",
  TROIS_DS: "4000000000003220",
} as const;

/**
 * Page Object Model pour le tunnel de paiement ZotoShop.
 * URL : /fr/checkout?step=address|delivery|payment|review
 *
 * Hérite de BasePage.
 * Pattern 3 couches :
 *   1. Locators privés
 *   2. Navigation
 *   3. Actions métier
 */
export class CheckoutPage extends BasePage {
  // === Couche 1 : LOCATORS PRIVÉS ===

  // Layout
  private readonly retourPanier: Locator;
  private readonly checkoutContainer: Locator;

  // Étape Adresse
  private readonly champEmail: Locator;
  private readonly champPrenom: Locator;
  private readonly champNom: Locator;
  private readonly champAdresse: Locator;
  private readonly champCodePostal: Locator;
  private readonly champVille: Locator;
  private readonly selectPays: Locator;
  private readonly champTelephone: Locator;
  private readonly caseAdresseFacturationIdentique: Locator;
  private readonly boutonSoumettreAdresse: Locator;
  private readonly boutonModifierAdresse: Locator;

  // Étape Livraison
  private readonly optionsLivraison: Locator;
  private readonly boutonSoumettreLivraison: Locator;
  private readonly boutonModifierLivraison: Locator;

  // Étape Paiement — formulaire carte simulée
  private readonly champNumeroCarte: Locator;
  private readonly champExpiration: Locator;
  private readonly champCVC: Locator;
  private readonly champTitulaire: Locator;
  private readonly boutonValiderCarte: Locator;
  private readonly boutonSoumettrePaiement: Locator;
  private readonly boutonModifierPaiement: Locator;

  // Étape Vérification
  private readonly boutonPasserCommande: Locator;

  constructor(page: Page) {
    super(page);

    // Layout
    this.retourPanier = page.getByTestId("back-to-cart-link");
    this.checkoutContainer = page.getByTestId("checkout-container");

    // Adresse
    this.champEmail = page.getByTestId("shipping-email-input");
    this.champPrenom = page.getByTestId("shipping-first-name-input");
    this.champNom = page.getByTestId("shipping-last-name-input");
    this.champAdresse = page.getByTestId("shipping-address-input");
    this.champCodePostal = page.getByTestId("shipping-postal-code-input");
    this.champVille = page.getByTestId("shipping-city-input");
    this.selectPays = page.getByTestId("shipping-country-select");
    this.champTelephone = page.getByTestId("shipping-phone-input");
    this.caseAdresseFacturationIdentique = page.getByTestId("billing-address-checkbox");
    this.boutonSoumettreAdresse = page.getByTestId("submit-address-button");
    this.boutonModifierAdresse = page.getByTestId("edit-address-button");

    // Livraison
    this.optionsLivraison = page.getByTestId("delivery-option-radio");
    this.boutonSoumettreLivraison = page.getByTestId("submit-delivery-option-button");
    this.boutonModifierLivraison = page.getByTestId("edit-delivery-button");

    // Paiement
    this.champNumeroCarte = page.getByTestId("card-number-input");
    this.champExpiration = page.getByTestId("card-expiry-input");
    this.champCVC = page.getByTestId("card-cvc-input");
    this.champTitulaire = page.getByTestId("card-holder-input");
    this.boutonValiderCarte = page.getByTestId("simulated-pay-button");
    this.boutonSoumettrePaiement = page.getByTestId("submit-payment-button");
    this.boutonModifierPaiement = page.getByTestId("edit-payment-button");

    // Vérification
    this.boutonPasserCommande = page.getByTestId("submit-order-button");
  }

  // === Couche 2 : NAVIGATION ===

  /**
   * Navigue vers le checkout et attend que le container soit prêt.
   * ⚠️ Le panier doit contenir au moins un article — utiliser la fixture panierAvecArticle.
   */
  async goto(): Promise<void> {
    await this.page.goto("/fr/checkout");
    await this.checkoutContainer.waitFor({ state: "visible" });
  }

  /**
   * Navigue directement vers une étape précise du tunnel.
   */
  async allerEtape(etape: "address" | "delivery" | "payment" | "review"): Promise<void> {
    await this.page.goto(`/fr/checkout?step=${etape}`);
    await this.checkoutContainer.waitFor({ state: "visible" });
  }

  async revenirAuPanier(): Promise<void> {
    await this.retourPanier.click();
    await this.page.waitForURL(/\/fr\/cart/);
  }

  // === Couche 3 : ACTIONS MÉTIER ===

  /**
   * Remplit le formulaire d'adresse de livraison.
   * pays : code ISO-2 en minuscules (ex: "fr", "be"). Optionnel — vaut déjà "fr" par défaut.
   */
  async remplirAdresseLivraison(adresse: {
    email: string;
    prenom: string;
    nom: string;
    adresse: string;
    codePostal: string;
    ville: string;
    pays?: string;
    telephone?: string;
  }): Promise<void> {
    await this.champEmail.fill(adresse.email);
    await this.champPrenom.fill(adresse.prenom);
    await this.champNom.fill(adresse.nom);
    await this.champAdresse.fill(adresse.adresse);
    await this.champCodePostal.fill(adresse.codePostal);
    await this.champVille.fill(adresse.ville);
    if (adresse.pays) {
      await this.selectPays.selectOption(adresse.pays);
    }
    if (adresse.telephone) {
      await this.champTelephone.fill(adresse.telephone);
    }
  }

  /**
   * Coche ou décoche la case "Adresse de facturation identique à l'adresse de livraison".
   * Par défaut la case est cochée — appeler cette méthode pour afficher le formulaire de facturation.
   */
  async basculerAdresseFacturationIdentique(): Promise<void> {
    await this.caseAdresseFacturationIdentique.click();
  }

  async soumettreAdresse(): Promise<void> {
    await this.boutonSoumettreAdresse.click();
    await this.page.waitForLoadState("networkidle");
  }

  async selectionnerPremierModeLivraison(): Promise<void> {
    await this.optionsLivraison.first().click();
  }

  async soumettreModeLivraison(): Promise<void> {
    await this.boutonSoumettreLivraison.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Remplit le formulaire de carte bancaire simulée.
   * Utiliser les constantes CARTES_TEST exportées depuis ce fichier.
   */
  async remplirCarteBancaire(carte: {
    numero: string;
    expiration: string;
    cvc: string;
    titulaire: string;
  }): Promise<void> {
    await this.champNumeroCarte.fill(carte.numero);
    await this.champExpiration.fill(carte.expiration);
    await this.champCVC.fill(carte.cvc);
    await this.champTitulaire.fill(carte.titulaire);
  }

  async validerCarteBancaire(): Promise<void> {
    await this.boutonValiderCarte.click();
    await this.page.waitForLoadState("networkidle");
  }

  async soumettreEtapePaiement(): Promise<void> {
    await this.boutonSoumettrePaiement.click();
    await this.page.waitForLoadState("networkidle");
  }

  async passerCommande(): Promise<void> {
    await this.boutonPasserCommande.click();
    await this.page.waitForLoadState("networkidle");
  }

  async modifierAdresse(): Promise<void> {
    await this.boutonModifierAdresse.click();
  }

  async modifierLivraison(): Promise<void> {
    await this.boutonModifierLivraison.click();
  }

  async modifierPaiement(): Promise<void> {
    await this.boutonModifierPaiement.click();
  }

  /**
   * Enchaîne les 4 étapes du tunnel avec une carte valide.
   * Raccourci pour les tests qui ne testent pas le checkout lui-même
   * mais ont besoin d'une commande passée comme précondition.
   */
  async completerTunnel(adresse: {
    email: string;
    prenom: string;
    nom: string;
    adresse: string;
    codePostal: string;
    ville: string;
  }): Promise<void> {
    await this.remplirAdresseLivraison(adresse);
    await this.soumettreAdresse();
    await this.selectionnerPremierModeLivraison();
    await this.soumettreModeLivraison();
    await this.remplirCarteBancaire({
      numero: CARTES_TEST.VALIDE,
      expiration: "12/26",
      cvc: "123",
      titulaire: `${adresse.prenom} ${adresse.nom}`,
    });
    await this.validerCarteBancaire();
    await this.soumettreEtapePaiement();
    await this.passerCommande();
  }
}
