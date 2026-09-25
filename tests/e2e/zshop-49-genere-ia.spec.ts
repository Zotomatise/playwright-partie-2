import { test } from "../fixtures/page.fixture";
import { ProductPage } from "@pages/ProductPage";
import { CartPage } from "@pages/CartPage";
import { CheckoutPage } from "@pages/CheckoutPage";

test.describe("@smoke ZSHOP-49 — Renseigner son adresse de livraison au paiement", () => {
  test(
    "@smoke AC1+AC2 : formulaire d'adresse accessible depuis le panier et soumission valide mène à l'étape livraison",
    async ({ page }) => {
      const productPage = new ProductPage(page);
      await productPage.goto("zotopad-controller");
      await productPage.addToCart();

      const cartPage = new CartPage(page);
      await cartPage.goto();
      await cartPage.expectHasItems(1);
      await cartPage.passerAuCheckout();

      const checkout = new CheckoutPage(page);
      await checkout.remplirAdresseLivraison({
        email: "testqa@zotoqa.fr",
        prenom: "Test",
        nom: "QA",
        adresse: "1 rue de la Paix",
        codePostal: "75001",
        ville: "Paris",
        pays: "fr",
      });
      await checkout.soumettreAdresse();
      await checkout.expectAdresseAcceptee();
    },
  );
});
