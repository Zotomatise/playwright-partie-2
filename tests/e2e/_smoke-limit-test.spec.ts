/**
 * FICHIER DE TEST TEMPORAIRE — à supprimer après validation du reporter
 *
 * Ce fichier contient 12 tests @smoke qui échouent volontairement
 * pour tester la limite de 8 échecs accumulés par le custom reporter Teams/Slack.
 * Au-delà de 8, le reporter doit afficher "max 8 listés".
 */

import { test, expect } from "@playwright/test";

// ============================================================================
// Tests avec expect().toBe() qui ratent (booléen, string, number)
// ============================================================================

test("[01] Vérification booléenne @smoke", async () => {
  const isValid = true;
  expect(isValid).toBe(false); // ❌ Échec volontaire
});

test("[02] Vérification string @smoke", async () => {
  const status = "success";
  expect(status).toBe("failure"); // ❌ Échec volontaire
});

test("[03] Vérification number @smoke", async () => {
  const count = 42;
  expect(count).toBe(99); // ❌ Échec volontaire
});

// ============================================================================
// Tests avec page.locator() + timeout court sur sélecteur inexistant
// ============================================================================

test("[04] Locator inexistant bouton @smoke", async ({ page }) => {
  await page.setContent("<html><body><h1>Page vide</h1></body></html>");

  // Sélecteur inexistant avec timeout court
  await expect(page.locator("#bouton-qui-existe-pas")).toBeVisible({
    timeout: 1000,
  }); // ❌ Échec volontaire
});

test("[05] Locator inexistant formulaire @smoke", async ({ page }) => {
  await page.setContent("<html><body><h1>Page vide</h1></body></html>");

  // Sélecteur inexistant avec timeout court
  await expect(page.locator("form#login")).toBeVisible({ timeout: 1000 }); // ❌ Échec volontaire
});

// ============================================================================
// Tests avec expect.toHaveURL() faux
// ============================================================================

test("[06] URL incorrecte produit @smoke", async ({ page }) => {
  await page.setContent("<html><body><h1>Page vide</h1></body></html>");

  await expect(page).toHaveURL("https://zotoshop.com/products/123"); // ❌ Échec volontaire
});

test("[07] URL incorrecte checkout @smoke", async ({ page }) => {
  await page.setContent("<html><body><h1>Page vide</h1></body></html>");

  await expect(page).toHaveURL("https://zotoshop.com/checkout/success"); // ❌ Échec volontaire
});

// ============================================================================
// Tests avec expect.toHaveText() faux
// ============================================================================

test("[08] Texte incorrect titre @smoke", async ({ page }) => {
  await page.setContent("<html><body><h1>Titre réel</h1></body></html>");

  await expect(page.locator("h1")).toHaveText("Titre attendu mais faux"); // ❌ Échec volontaire
});

test("[09] Texte incorrect description @smoke", async ({ page }) => {
  await page.setContent("<html><body><p>Description réelle</p></body></html>");

  await expect(page.locator("p")).toHaveText("Description qui n'existe pas"); // ❌ Échec volontaire
});

// ============================================================================
// Tests avec expect(count).toBeGreaterThan() faux
// ============================================================================

test("[10] Compteur produits insuffisant @smoke", async ({ page }) => {
  await page.setContent(
    "<html><body><div class='product'>A</div><div class='product'>B</div></body></html>",
  );

  const count = await page.locator(".product").count();
  expect(count).toBeGreaterThan(100); // ❌ Échec volontaire (2 > 100 est faux)
});

test("[11] Compteur panier vide @smoke", async ({ page }) => {
  await page.setContent(
    "<html><body><div class='cart-items'></div></body></html>",
  );

  const count = await page.locator(".cart-item").count();
  expect(count).toBeGreaterThan(5); // ❌ Échec volontaire (0 > 5 est faux)
});

// ============================================================================
// Test avec throw new Error volontaire
// ============================================================================

test("[12] Erreur critique système @smoke", async () => {
  throw new Error(
    "CRITICAL: Erreur système simulée pour tester le reporter - connexion base de données échouée",
  ); // ❌ Échec volontaire
});
