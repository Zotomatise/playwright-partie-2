import { test, expect } from "@playwright/test";

// Fixture PÉDAGOGIQUE (L5) : test volontairement POURRI, avec les 5 anti-patterns.
// Sert d'entrée à la review IA. Ne pas "corriger" ici : c'est le mauvais exemple.

let panierId: string; // état partagé entre tests -> interdépendance

test("ajout produit", async ({ page }) => {
  await page.goto("https://zotoshop.zotomatise.com/fr/store");
  await page.waitForTimeout(4000);                              // attente aveugle
  await page.click(".css-1a2b3c > div:nth-child(2) button");   // sélecteur fragile (CSS positionnel + classe générée)
  panierId = "abc-123";                                         // l'état fuit vers le test suivant
  expect(true).toBeTruthy();                                    // assertion faible : ne teste rien
});

test("verif panier (depend du test precedent)", async ({ page }) => {
  await page.goto("https://zotoshop.zotomatise.com/fr/cart");
  await page.waitForTimeout(2000);                                        // attente aveugle
  const badge = page.locator("div:nth-child(3) span.MuiBadge-badge-42");  // sélecteur fragile
  console.log("panier de l'autre test :", panierId);                      // dépend de l'état du test précédent
  // aucune assertion métier réelle
});

// aucun afterEach / cleanup : l'état n'est jamais remis à zéro entre les tests
