import { test } from "../fixtures/page.fixture";
import { CheckoutPage } from "@pages/CheckoutPage";
import adresses from "../data/adresses.json" with { type: "json" };

// Le jeu de données généré en L7 est lu directement depuis le fichier du projet.
// On ne garde que les cas limites (limite = true), et chacun devient un test :
// la même donnée tordue (apostrophe, accents, nom très long) est rejouée dans le vrai checkout.
const casLimite = adresses.filter((a) => a.limite);

test.describe("@edge Checkout — formulaire adresse, cas limites", () => {
  for (const cas of casLimite) {
    test(`@edge ${cas.pourquoi}`, async ({
      panierAvecArticle: _panier,
      page,
    }) => {
      // panierAvecArticle garantit qu'il y a un article en session avant d'entrer dans le tunnel.
      const checkout = new CheckoutPage(page);
      await checkout.allerEtape("address");
      await checkout.remplirAdresseLivraison(cas);
      await checkout.soumettreAdresse();
      await checkout.expectAdresseAcceptee();
    });
  }
});
