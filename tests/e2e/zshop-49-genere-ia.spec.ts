import { test } from "../fixtures/page.fixture";
import { CheckoutPage } from "@pages/CheckoutPage";

test.describe("@regression ZSHOP-49 — Renseigner son adresse de livraison au paiement", () => {
  test(
    "@regression AC1+AC2 : formulaire adresse accessible depuis le panier et étape livraison s'affiche après soumission",
    async ({ panierAvecArticle, page }) => {
      const checkoutPage = new CheckoutPage(page);

      await panierAvecArticle.passerAuCheckout();
      await checkoutPage.allerEtape("address");

      await checkoutPage.remplirAdresseLivraison({
        email: "test-zshop49@zotoshop.fr",
        prenom: "Testeur",
        nom: "IA",
        adresse: "1 rue de la Paix",
        codePostal: "75001",
        ville: "Paris",
        pays: "fr",
        telephone: "+33600000000",
      });
      await checkoutPage.soumettreAdresse();

      // AC1 : formulaire adresse accessible et soumission acceptée
      await checkoutPage.expectAdresseAcceptee();

      // AC2 : étape livraison accessible (échec ici = étape non visible)
      await checkoutPage.selectionnerPremierModeLivraison();
    },
  );
});
