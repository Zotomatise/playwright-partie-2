import { test, expect } from "@playwright/test";

test("optional chaining - longueur du prix", async ({ page }) => {
  await page.goto("/fr/store");

  const priceText = await page.getByTestId("price").first().textContent();

  const longueur = priceText?.length;

  console.log("Longueur du texte du prix :", longueur);
});

test("vérification HTTPS du CTA store", async ({ page }) => {
  await page.goto("/fr");

  const cta = page.getByRole("link", { name: /Découvrir nos produits/i });
  const href = await cta.getAttribute("href");

  const isHttps = href?.startsWith("https://");

  expect(isHttps).toBe(true);
});
test("vérification HTTPS du CTA store avec type Guard", async ({ page }) => {
  await page.goto("/fr");

  const cta = page.getByRole("link", { name: /Découvrir nos produits/i });
  const href = await cta.getAttribute("href");

  if (href === null) {
    throw new Error("Lien du CTA introuvable");
  }

  const isHttps = href.startsWith("https://");

  expect(isHttps).toBe(true);
});

test("|| vs ?? — produit ZotoShop en rupture", async () => {
  const stockQuantity = 0;

  const affichage1 = stockQuantity || "Plus en stock";
  const affichage2 = stockQuantity ?? "Plus en stock";

  console.log("Avec || :", affichage1);
  console.log("Avec ?? :", affichage2);

  const description = "";

  const texte1 = description || "Aucune description";
  const texte2 = description ?? "Aucune description";

  console.log("Avec || :", texte1);
  console.log("Avec ?? :", texte2);
});

test("lecture du prix - VERSION PROPRE avec combo ?. + ??", async ({
  page,
}) => {
  await page.goto("/fr/store");

  const priceText =
    (await page.getByTestId("price").first().textContent())?.trim() ?? "0";

  const price = parseFloat(priceText.replace("€", ""));

  expect(price).toBeGreaterThan(0);
});
