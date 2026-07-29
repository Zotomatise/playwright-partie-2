# Plan de test — Page Boutique ZotoShop

**URL cible :** `https://zotoshop.zotomatise.com/fr/store`
**Date :** 2026-07-08
**Scope :** Affichage des produits · Prix · Accès à une fiche produit

---

## Conventions

| Balise | Signification |
|--------|--------------|
| `@smoke` | Scénario bloquant — à exécuter en CI sur chaque PR |
| `@regression` | Couverture complète — à exécuter avant chaque release |
| `@edge` | Cas limite / comportement dégradé |

**Sélecteurs de référence (tirés des POM existants) :**

| Élément | Sélecteur |
|---------|-----------|
| Titre de page | `getByRole("heading", { name: /Tous les produits/i })` |
| Carte produit | `getByTestId("product-wrapper")` |
| Prix sur la carte | `getByTestId("price")` |
| Titre du produit sur la carte | `getByTestId("product-title")` |
| Titre sur la page produit | `locator("h1").first()` |
| Prix sur la page produit | `getByTestId("product-price").first()` |
| Bouton ajout panier | `getByTestId("add-product-button")` |
| Variante (couleur, taille) | `getByTestId("option-button")` |

---

## Partie 1 — Affichage des produits

### TC-01 · Chargement de la page boutique `@smoke`

**Précondition :** aucune session utilisateur requise.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Naviguer vers `/fr/store` | Statut HTTP 200 |
| 2 | Vérifier le titre de la page | Le `<h1>` contient "Tous les produits" |
| 3 | Vérifier l'URL | L'URL se termine par `/fr/store` |

---

### TC-02 · Au moins un produit est affiché `@smoke`

**Précondition :** page boutique chargée.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Compter les éléments `[data-testid="product-wrapper"]` | Count ≥ 1 |
| 2 | Vérifier la visibilité du premier élément | Premier `product-wrapper` visible à l'écran |

---

### TC-03 · Le catalogue contient au moins 3 produits `@regression`

**Précondition :** page boutique chargée.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Compter les éléments `[data-testid="product-wrapper"]` | Count ≥ 3 |

---

### TC-04 · Chaque carte affiche un titre non vide `@smoke`

**Précondition :** page boutique chargée, au moins un produit présent.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Récupérer tous les éléments `[data-testid="product-title"]` | Liste non vide |
| 2 | Pour chaque titre : lire le `textContent()` | Valeur non nulle et non vide après `.trim()` |

---

### TC-05 · Chaque carte affiche une image produit `@regression`

**Précondition :** page boutique chargée.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Pour chaque `product-wrapper`, localiser la balise `<img>` | La balise `<img>` est présente |
| 2 | Vérifier la visibilité | L'image est visible (pas cassée) |
| 3 | Vérifier l'attribut `src` | `src` non vide et ne contient pas `placeholder` |

---

### TC-06 · Boutique vide — état dégradé `@edge`

**Précondition :** intercepter `GET /api/products` et retourner `{ products: [] }`.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Mocker l'API avec `page.route()` pour retourner un tableau vide | — |
| 2 | Naviguer vers `/fr/store` | La page se charge sans erreur JS |
| 3 | Vérifier l'absence de `product-wrapper` | Count = 0 ou message "Aucun produit disponible" affiché |

---

## Partie 2 — Prix

### TC-07 · Chaque carte affiche un prix visible `@smoke`

**Précondition :** page boutique chargée.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Pour chaque `product-wrapper`, localiser `[data-testid="price"]` | Élément présent |
| 2 | Vérifier la visibilité | Prix visible à l'écran |
| 3 | Lire le `textContent()` | Valeur non nulle et non vide après `.trim()` |

---

### TC-08 · Le premier prix est strictement positif `@smoke`

**Précondition :** page boutique chargée.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Lire le texte de `[data-testid="price"]:first` | Texte contient un nombre |
| 2 | Parser : `parseFloat(text.replace("€", "").trim())` | Valeur > 0 |

---

### TC-09 · Tous les prix sont strictement positifs `@regression`

**Précondition :** page boutique chargée.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Récupérer tous les éléments `[data-testid="price"]` | Liste non vide |
| 2 | Pour chaque élément : parser le prix | Chaque valeur > 0 |

---

### TC-10 · Format du prix — devise EUR `@regression`

**Précondition :** page boutique chargée.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Lire le texte brut du premier prix | Texte contient le symbole `€` |
| 2 | Vérifier le format | Correspond au pattern `/^\d+(\.\d{2})?€$/` (ex : `29.99€`) |

---

### TC-11 · Cohérence prix carte vs page produit `@regression`

**Précondition :** page boutique chargée.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Lire le prix du premier produit sur la carte (`[data-testid="price"]`) | Valeur `prixCarte` |
| 2 | Cliquer sur ce produit → naviguer vers `/fr/products/[slug]` | Navigation réussie |
| 3 | Lire le prix sur la page produit (`[data-testid="product-price"]`) | Valeur `prixPage` |
| 4 | Comparer | `prixCarte === prixPage` |

---

### TC-12 · Produit à prix zéro — cas limite `@edge`

**Précondition :** mocker `GET /api/products` pour retourner un produit avec `price: 0`.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Intercepter l'API et injecter un produit `{ price: 0 }` | — |
| 2 | Naviguer vers `/fr/store` | La page se charge |
| 3 | Vérifier l'affichage du prix | Le prix `0€` est affiché ou le produit est masqué (selon règle métier) |

---

## Partie 3 — Accès à une fiche produit

### TC-13 · Cliquer sur un produit navigue vers la fiche `@smoke`

**Précondition :** page boutique chargée, au moins un produit visible.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Cliquer sur le premier `[data-testid="product-wrapper"]` | Navigation déclenchée |
| 2 | Attendre `page.waitForURL(/\/fr\/products\/[a-z0-9-]+/)` | URL correspond au pattern |
| 3 | Vérifier qu'on n'est plus sur `/fr/store` | `isOnStorePage()` retourne `false` |

---

### TC-14 · La fiche produit affiche les éléments essentiels `@smoke`

**Précondition :** être sur une page `/fr/products/[slug]`.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Vérifier la présence du `<h1>` | Titre visible et non vide |
| 2 | Vérifier `[data-testid="product-price"]` | Prix visible |
| 3 | Vérifier `[data-testid="add-product-button"]` | Bouton "Ajouter au panier" visible |
| 4 | Vérifier la présence d'une image produit | Image visible |

---

### TC-15 · Le titre de la fiche correspond au titre de la carte `@regression`

**Précondition :** page boutique chargée.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Lire le titre du premier produit sur la carte (`[data-testid="product-title"]`) | Valeur `titreCarte` |
| 2 | Cliquer sur ce produit | Navigation vers `/fr/products/[slug]` |
| 3 | Lire le `<h1>` de la page produit | Valeur `titrePage` |
| 4 | Comparer (insensible à la casse) | `titreCarte.toLowerCase() === titrePage.toLowerCase()` |

---

### TC-16 · Le prix de la fiche est strictement positif `@regression`

**Précondition :** être sur une page `/fr/products/[slug]`.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Lire `[data-testid="product-price"]` | Texte non vide |
| 2 | Parser : `parseFloat(text.replace("€", "").trim())` | Valeur > 0 |

---

### TC-17 · Sélection de variante obligatoire avant ajout au panier `@regression`

**Précondition :** être sur une page produit avec des variantes (`[data-testid="option-button"]` présent).

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Vérifier l'état du bouton `[data-testid="add-product-button"]` sans sélection | Bouton désactivé (`disabled`) |
| 2 | Cliquer sur `[data-testid="option-button"]:first` | Variante sélectionnée |
| 3 | Vérifier l'état du bouton | Bouton activé |

---

### TC-18 · Ajout au panier depuis la fiche produit `@smoke`

**Précondition :** être sur une page produit avec au moins une variante.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Cliquer sur la première variante `[data-testid="option-button"]` | Variante sélectionnée |
| 2 | Cliquer sur `[data-testid="add-product-button"]` | Requête AJAX d'ajout lancée |
| 3 | Attendre `networkidle` | Requête terminée sans erreur |
| 4 | Vérifier le compteur du panier dans le header | Compteur = 1 |

---

### TC-19 · Retour au store depuis la fiche produit `@regression`

**Précondition :** être sur une page produit.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Cliquer sur le bouton "Retour" ou le lien de navigation | — |
| 2 | Vérifier l'URL | Retour sur `/fr/store` |
| 3 | Vérifier que les produits sont toujours affichés | `product-wrapper` count ≥ 1 |

---

### TC-20 · Slug invalide retourne une page 404 `@edge`

**Précondition :** aucune.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Naviguer vers `/fr/products/produit-qui-nexiste-pas` | — |
| 2 | Vérifier le statut ou le contenu | Page 404 affichée (statut HTTP 404 ou message "Page introuvable") |
| 3 | Vérifier l'absence du bouton "Ajouter au panier" | Le bouton n'est pas présent |

---

## Partie 4 — Cas limites supplémentaires

### TC-21 · Erreur serveur 500 — comportement de la boutique `@edge`

**Précondition :** mocker `GET /api/products` pour retourner un statut 500.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Intercepter l'API avec `page.route()` et retourner `{ status: 500 }` | — |
| 2 | Naviguer vers `/fr/store` | Pas de crash JS non géré |
| 3 | Vérifier qu'un message d'erreur est affiché | Message d'erreur visible à l'utilisateur |

---

### TC-22 · Accès direct par URL `/fr/store` `@smoke`

**Précondition :** aucune session, navigation directe sans passer par la homepage.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Ouvrir directement `https://zotoshop.zotomatise.com/fr/store` | Statut 200 |
| 2 | Vérifier le titre | `<h1>` contient "Tous les produits" |
| 3 | Vérifier la présence des produits | Au moins un `product-wrapper` visible |

---

### TC-23 · CTA homepage redirige vers la boutique `@regression`

**Précondition :** être sur la homepage `/fr`.

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | Localiser le CTA "Voir la boutique" (ou équivalent) | Lien visible |
| 2 | Cliquer dessus | Navigation vers `/fr/store` |
| 3 | Vérifier l'URL | URL se termine par `/fr/store` |

---

## Récapitulatif

| ID | Titre | Tag | Priorité |
|----|-------|-----|----------|
| TC-01 | Chargement page boutique | `@smoke` | Critique |
| TC-02 | Au moins un produit affiché | `@smoke` | Critique |
| TC-03 | Catalogue ≥ 3 produits | `@regression` | Haute |
| TC-04 | Titres non vides | `@smoke` | Critique |
| TC-05 | Images visibles | `@regression` | Haute |
| TC-06 | Boutique vide (mock) | `@edge` | Moyenne |
| TC-07 | Prix visible sur chaque carte | `@smoke` | Critique |
| TC-08 | Premier prix positif | `@smoke` | Critique |
| TC-09 | Tous les prix positifs | `@regression` | Haute |
| TC-10 | Format prix EUR | `@regression` | Haute |
| TC-11 | Cohérence prix carte / fiche | `@regression` | Haute |
| TC-12 | Prix à zéro (mock) | `@edge` | Moyenne |
| TC-13 | Clic → navigation fiche produit | `@smoke` | Critique |
| TC-14 | Éléments essentiels fiche | `@smoke` | Critique |
| TC-15 | Titre carte = titre fiche | `@regression` | Haute |
| TC-16 | Prix fiche positif | `@regression` | Haute |
| TC-17 | Variante obligatoire avant panier | `@regression` | Haute |
| TC-18 | Ajout au panier complet | `@smoke` | Critique |
| TC-19 | Retour au store | `@regression` | Moyenne |
| TC-20 | Slug invalide → 404 | `@edge` | Moyenne |
| TC-21 | Erreur 500 (mock) | `@edge` | Moyenne |
| TC-22 | Accès direct URL | `@smoke` | Critique |
| TC-23 | CTA homepage → store | `@regression` | Haute |

**Total : 23 scénarios** — 8 `@smoke` · 11 `@regression` · 4 `@edge`
