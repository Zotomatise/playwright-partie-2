---
name: project-zotoshop-antipatterns
description: Anti-patterns récurrents observés dans les tests Playwright ZotoShop et règles de qualité non négociables du projet
metadata:
  type: project
---

## Contexte

ZotoShop est une boutique e-commerce Medusa.js / Next.js, locale fr-FR. Les tests Playwright sont dans `dev/tests/Zotoshop-Test-Playwright/`.

## Règles non négociables (observées en pratique)

- Pas de `waitForTimeout` hardcodé (règle CLAUDE.md + règle Rofim)
- Pas de sélecteurs CSS positionnels (`:nth-child`, `.css-1a2b3c`) — utiliser `data-testid`
- Pas de `expect(true).toBeTruthy()` ou assertions vides
- Les locators doivent être dans le POM, jamais dans les specs
- Les noms de tests doivent être en français (convention Zotomatise)
- Pas de `page.goto()` avec URL absolue — le `baseURL` est configuré globalement, utiliser des chemins relatifs `/fr/store`
- Pas d'état partagé entre tests (variable globale `let` hors scope)

## POMs disponibles

- `tests/pages/BasePage.ts` — classe abstraite de base
- `tests/pages/StorePage.ts` — page boutique, locators `data-testid` (product-wrapper, price, product-title)
- `tests/pages/ProductPage.ts` — page produit (add-product-button, etc.)
- `tests/pages/CartPage.ts` — page panier (empty-cart-message, etc.)

## Fixtures customs

- `tests/fixtures/page.fixture.ts` — fixtures étendues : `storePage`, `testUser`, `productPagePrete`, `panierAvecArticle`, `apiClient` (worker-scoped), `loggerAuto` (auto)

## Anti-patterns récurrents observés (panier-mauvais.spec.ts)

1. `waitForTimeout` hardcodé (4000ms, 2000ms) → remplacer par `waitFor({ state: 'visible' })` ou attentes sémantiques
2. Sélecteur CSS généré `.css-1a2b3c > div:nth-child(2) button` → utiliser `data-testid` via POM
3. Variable globale `let panierId` partagée entre tests → isolation par fixture
4. `expect(true).toBeTruthy()` → assertion sans valeur, faux positif permanent
5. Absence totale d'assertion métier dans le second test
6. Import `{ test, expect }` natif au lieu de la fixture custom → les fixtures `storePage`, `panierAvecArticle` ne sont pas utilisées
7. URL absolue `https://zotoshop.zotomatise.com/fr/store` → utiliser chemin relatif `/fr/store`
8. Noms de tests en minuscules sans description précise, pas de `test.describe`
9. Absence de `afterEach` / cleanup — état résiduel entre runs
10. Aucun tag (`@smoke`, `@regression`) — invisibilité CI

**Why:** Ces anti-patterns ont été identifiés dans un fichier pédagogique volontairement dégradé (L5), mais ils représentent des erreurs réelles à signaler en formation.

**How to apply:** Lors des revues ZotoShop, vérifier systématiquement ces 10 points en priorité.
