# 📡 API ZotoShop — Documentation Tech

**À partager avec l'équipe Test / Frontend / Intégration.**

---

## 🌐 URL de base

| Environnement | URL |
|---|---|
| **Production** | `https://api.zotomatise.com` |
| Staging | (à venir) |
| Dev local | `http://localhost:9000` (Docker compose) |

---

## 🔑 Authentification — Publishable API Key

Tous les endpoints `/store/*` nécessitent le header :

```
x-publishable-api-key: pk_0ab41d879415264941a92a80aceb00b1b03b93128c7bfaa08f06ae56eda41233
```

> 💡 La clé **publishable** est un identifiant d'application (pas un mot de passe utilisateur). On peut la committer dans un `.env` partagé sans paranoia. **Mais on évite quand même de la mettre en dur dans le code.**

---

## 🛒 Endpoints utiles (Module 5)

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check (200 OK) |
| `GET` | `/store/products` | Liste tous les produits |
| `GET` | `/store/products?limit=5` | Liste les 5 premiers |
| `GET` | `/store/products?handle=xxx` | Filtre par handle |
| `GET` | `/store/regions` | Liste les régions de vente |

---

## 📦 Exemple de réponse `/store/products?limit=2`

```json
{
  "products": [
    {
      "id": "prod_01KKND4SVY0BCTA6C77YQ9WY6R",
      "title": "ZotoBook Pro 16",
      "handle": "zotobook-pro-16",
      "variants": [ ... ]
    },
    ...
  ],
  "count": 12,
  "offset": 0,
  "limit": 2
}
```

---

*Doc partagée par l'équipe back ZotoShop — utilisée comme support pour les tests Playwright (Module 5).*
