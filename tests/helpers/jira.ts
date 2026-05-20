import { test } from "@playwright/test";
import * as allure from "allure-js-commons";

/**
 * Mapping des tickets Jira de démo ZotoShop (projet SCRUM).
 *
 * 🔗 https://zotomatise.atlassian.net/jira/software/projects/SCRUM/boards/1
 */
export const JIRA_TICKETS = {
  /** Bug Highest — bouton "Commander" invisible sur mobile-safari (iPhone 12) */
  CHECKOUT_BUTTON_MOBILE: "SCRUM-5",

  /** Bug High — prix négatif quand stock = 0 */
  PRICE_NEGATIVE_OUT_OF_STOCK: "SCRUM-6",

  /** Bug Low — fonte flaky sur Allure screenshots */
  FONT_RACE_CONDITION: "SCRUM-7",

  /** Story Medium — audit a11y WCAG AA checkout */
  A11Y_CHECKOUT_AUDIT: "SCRUM-8",

  /** Story Medium — notif Teams sur échec @smoke en CI */
  TEAMS_NOTIF_CI: "SCRUM-9",
} as const;

type JiraTicketId = (typeof JIRA_TICKETS)[keyof typeof JIRA_TICKETS];

// Allure 3 ne reconnaît PAS "major". Valeurs valides : blocker / critical / normal / minor / trivial
type Severity = "blocker" | "critical" | "normal" | "minor" | "trivial";

const JIRA_BASE_URL = "https://zotomatise.atlassian.net/browse";

export async function linkJira(
  ticketId: JiraTicketId,
  severity: Severity = "normal",
) {
  const jiraUrl = `${JIRA_BASE_URL}/${ticketId}`;

  // 1 Playwright HTML report — l'URL complète dans description est auto-cliquable
  test.info().annotations.push({
    type: `Jira ${ticketId}`,
    description: jiraUrl,
  });

  // 2 Allure 3 — API officielle allure-js-commons
  await allure.issue(ticketId, jiraUrl);
  await allure.severity(severity);
  await allure.label("jira-id", ticketId);
}
