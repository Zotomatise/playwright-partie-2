# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run all E2E tests (local)
npm test

# Run a single spec file
npx playwright test tests/e2e/store-page.pom.spec.ts --project=chromium

# Run tests by tag
npx playwright test --project=smoke-chrome          # @smoke only
npx playwright test --project=regression-chrome     # @regression only

# Run headed / debug
npm run test:headed
npm run test:debug

# CI run (cleans reports first, smoke-chrome only)
npm run test:ci

# Type check (also runs on pre-commit via Husky)
npm run typecheck

# Lint
npm run lint

# Open Allure report
npx allure open allure-report

# Record a new test with codegen
npm run codegen
```

## Environment

Copy `.env.example` to `.env`. Key variables:

| Variable                                  | Purpose                                                           |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `STOREFRONT_URL`                          | Base URL for E2E tests (default: `http://localhost:8000`)         |
| `ZOTOSHOP_API_URL`                        | Base URL for API project tests                                    |
| `PUBLISHABLE_API_KEY`                     | Medusa publishable API key sent as `x-publishable-api-key` header |
| `TEAMS_WEBHOOK_URL` / `SLACK_WEBHOOK_URL` | Notification webhooks (optional, reporter is silent if absent)    |

ZotoShop must be running locally before tests execute. Authentication is handled once by `playwright/global-setup.ts`, which writes `playwright/.auth/user.json` (storageState used by all E2E tests).

## Architecture

### Test directories

| Directory        | What runs there                                               |
| ---------------- | ------------------------------------------------------------- |
| `tests/e2e/`     | UI end-to-end tests — all browser projects                    |
| `tests/api/`     | Pure API tests (`smoke-api`, `api` projects) — no browser     |
| `tests/hybride/` | Tests combining API calls + UI steps                          |
| `tests/mocking/` | Tests using `page.route()` to intercept browser-side requests |

### 4-layer POM pattern

Every Page Object inherits `BasePage` and follows this layer structure:

1. **Private Locators** — all selectors declared in the constructor, using `getByTestId()` or `getByRole()` (never CSS class selectors)
2. **Navigation** — `goto()` and navigation helpers that wait for page readiness
3. **Actions** — business-level methods (click, fill, select variant…)
4. **Assertions** — `expectXyz()` methods wrapping `expect()` calls — tests call these, not raw `expect()`

Path aliases: `@pages/*` → `tests/pages/`, `@fixtures/*` → `tests/fixtures/`

### Fixtures (`tests/fixtures/page.fixture.ts`)

| Fixture             | Scope       | Pre-condition                                                        |
| ------------------- | ----------- | -------------------------------------------------------------------- |
| `storePage`         | page        | none — creates StorePage                                             |
| `testUser`          | page        | generates timestamped email                                          |
| `productPagePrete`  | page        | navigated to `/fr/products/cable-zotolink`                           |
| `panierAvecArticle` | page        | depends on `productPagePrete`; adds to cart, navigates to `/fr/cart` |
| `apiClient`         | **worker**  | `APIRequestContext` toward `ZOTOSHOP_API_URL`                        |
| `loggerAuto`        | page (auto) | logs test duration to console                                        |

Chain fixtures by depending on each other (see `panierAvecArticle → productPagePrete`).

### Test tags

Tag tests inline in the title string:

- `@smoke` — critical path, runs on every CI push (`smoke-chrome` project)
- `@regression` — full suite before release (`regression-chrome` project)
- `@edge` — mocked or degraded-state scenarios

### Mocking constraint

`page.route()` intercepts **browser-side** (client) requests only. Next.js Server Components fetch data server-side — those calls are not interceptable. Use `page.route()` only for pages/components that fetch from the browser (example: `/fr/products-live`). The existing `mockBoutique()` helper in `tests/helpers/mock-boutique.ts` shows the pattern.

### Key data-testid reference

| Element                 | Selector                             |
| ----------------------- | ------------------------------------ |
| Product card            | `product-wrapper`                    |
| Product price (store)   | `price`                              |
| Product title (store)   | `product-title`                      |
| Add to cart button      | `add-product-button`                 |
| Variant option          | `option-button`                      |
| Stock indicator         | `product-stock-indicator`            |
| Nav cart link (counter) | `nav-cart-link` — text: `Panier (N)` |
| Cart item               | `cart-item`                          |
| Empty cart message      | `empty-cart-message`                 |

### Reporters

`reporters/team-notifs-reporter.ts` sends failures to Teams and Slack via webhooks. It fires after the full run and is silent when no failures occur or when webhooks are not configured. It filters out tests without the `@smoke` tag in the default configuration — check the reporter source if notification behavior seems unexpected.

### Out-of-stock test product

The seed includes a dedicated QA product at slug `cable-rupture-test` (SKU `ZCABLE-RUPTURE-1M`, stocked at 0 units, `manage_inventory: true`). Use this slug when testing the "Rupture de stock" state — do not rely on setting stock via API in tests.

## Conventions de test (non négociable)

- Locators sémantiques uniquement : getByRole, getByTestId. Jamais de CSS positionnel.
- Jamais de waitForTimeout. Auto-attente Playwright, ou attente d'un état.
- Réutiliser les Page Objects de tests/pages/. Ne jamais réécrire un locator dans un test.
- Chaque test est indépendant et nettoie son état (afterEach).
- Une assertion métier réelle. Jamais expect(true).toBeTruthy().
