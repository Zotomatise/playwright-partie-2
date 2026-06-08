import { test, expect } from "@playwright/test";

/**
 * DEMO M9.L5 — Tests volontairement en échec pour le cas d'école "notif Teams silencieuse".
 *
 * Aucun de ces 2 tests n'a `@smoke` dans son titre — c'est volontaire.
 * Le reporter avec filtre `@smoke` les ignore => silence radio en notif.
 * Le reporter sans filtre les notifie => preuve du fix en cam.
 *
 * À SUPPRIMER après le tournage de la leçon.
 */

test.describe("DEMO L5 — Faux échecs pour cas d'école notif Teams", () => {
  test("la home affiche un titre qui n'existe pas (demo échec 1)", async ({
    page,
  }) => {
    await page.goto("/fr");
    // Heading volontairement inexistant pour forcer l'échec
    await expect(
      page.getByRole("heading", {
        name: /Titre Demo Qui N'Existe Pas Sur ZotoShop/i,
      }),
    ).toBeVisible();
  });

  test("la page store contient un texte introuvable (demo échec 2)", async ({
    page,
  }) => {
    await page.goto("/fr/store");
    // Texte volontairement inexistant pour forcer l'échec
    await expect(
      page.getByText(/Phrase Demo Qui Ne Sera Jamais Affichée/i),
    ).toBeVisible();
  });
});
