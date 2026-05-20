import type {
  Reporter,
  TestCase,
  TestResult,
  FullResult,
  Suite,
  FullConfig,
} from "@playwright/test/reporter";

/**
 * Reporter custom — envoie une notif Teams (MessageCard riche) ou Slack
 * sur échec de tests @smoke.
 *
 * Variables d'env supportées :
 *   TEAMS_WEBHOOK_URL  → format MessageCard (gras, barre rouge, sections, bouton)
 *   SLACK_WEBHOOK_URL  → format {text: ...} simple
 *
 * Détection auto : si l'URL contient "webhook.office.com" → MessageCard.
 * Sinon → texte simple {text: ...} (compatible Slack, webhook.site, Discord).
 */

const TEAMS_WEBHOOK = process.env.TEAMS_WEBHOOK_URL ?? "";
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL ?? "";

const MAX_FAILURES = 8;
const ERROR_TRUNCATE = 160;

/** Retire les codes ANSI (couleurs terminal) qui pollueraient le message Teams/Slack */
const stripAnsi = (s: string): string =>
  s.replace(/\[[0-9;]*m/g, "");

class TeamNotifReporter implements Reporter {
  private failures: { title: string; fullTitle: string; error: string }[] = [];
  private totalTests = 0;
  private startedAt = Date.now();

  onBegin(_config: FullConfig, suite: Suite) {
    this.totalTests = suite.allTests().length;
    this.startedAt = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status !== "failed") return;

    // Filtre @smoke (tag dans le titre ou le describe)
    const fullTitle = test.titlePath().join(" › ");
    if (!fullTitle.includes("@smoke")) return;

    this.failures.push({
      title: test.title,
      fullTitle: test.titlePath().slice(1).join(" › "),
      error: stripAnsi(result.error?.message ?? "Erreur inconnue"),
    });
  }

  async onEnd(result: FullResult) {
    if (this.failures.length === 0) return;

    if (TEAMS_WEBHOOK) {
      await this.sendToTeams(TEAMS_WEBHOOK, result);
    }
    if (SLACK_WEBHOOK) {
      await this.sendToSlack(SLACK_WEBHOOK, result);
    }
    if (!TEAMS_WEBHOOK && !SLACK_WEBHOOK) {
      console.warn("⚠️  Aucun webhook configuré — notification ignorée");
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // Teams — MessageCard riche
  // ──────────────────────────────────────────────────────────────────────
  private async sendToTeams(url: string, result: FullResult) {
    const totalFailed = this.failures.length;
    const totalPassed = this.totalTests - totalFailed;
    const durationSec = Math.round((Date.now() - this.startedAt) / 1000);

    const shown = this.failures.slice(0, MAX_FAILURES);
    const detailsText = shown
      .map((f) => {
        const err = f.error.replace(/\n+/g, " ").slice(0, ERROR_TRUNCATE);
        return `**${f.fullTitle}**\n\`${err}\``;
      })
      .join("\n\n");

    const remaining = this.failures.length - MAX_FAILURES;
    const overflow =
      remaining > 0
        ? `\n\n_+ ${remaining} autre(s) échec(s) — voir le rapport complet._`
        : "";

    const facts: { name: string; value: string }[] = [
      { name: "Env", value: process.env.ENV_NAME ?? "LOCAL" },
      {
        name: "Branche",
        value:
          process.env.GITHUB_REF_NAME ?? process.env.GIT_BRANCH ?? "local",
      },
      { name: "Durée", value: `${durationSec}s` },
      {
        name: "Résultat",
        value: `${totalPassed} / ${this.totalTests} passés (${totalFailed} échec)`,
      },
    ];

    const messageCard: Record<string, unknown> = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      themeColor: "D00000",
      summary: `${totalFailed} test(s) smoke en échec ZotoShop`,
      sections: [
        {
          activityTitle: `🚨 ${totalFailed} test(s) @smoke en échec sur ZotoShop`,
          activitySubtitle: `${totalPassed} / ${this.totalTests} passés en ${durationSec}s`,
          facts,
          markdown: true,
        },
        {
          title: "**Détails des échecs**",
          text: detailsText + overflow,
          markdown: true,
        },
      ],
    };

    // Bouton vers le run GitHub si en CI
    const repo = process.env.GITHUB_REPOSITORY;
    const runId = process.env.GITHUB_RUN_ID;
    if (repo && runId) {
      messageCard.potentialAction = [
        {
          "@type": "OpenUri",
          name: "🔗 Voir le run GitHub",
          targets: [
            {
              os: "default",
              uri: `https://github.com/${repo}/actions/runs/${runId}`,
            },
          ],
        },
      ];
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageCard),
      });
      if (response.ok) {
        console.log(
          `📤 Notif Teams (MessageCard) envoyée (${totalFailed} échec(s))`,
        );
      } else {
        const text = await response.text();
        console.error(
          `❌ Teams webhook HTTP ${response.status} — ${text.slice(0, 200)}`,
        );
      }
    } catch (err) {
      console.error(
        `❌ Teams webhook : ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // Slack — format texte simple {text: ...}
  // ──────────────────────────────────────────────────────────────────────
  private async sendToSlack(url: string, _result: FullResult) {
    const totalFailed = this.failures.length;
    const summary = `🚨 ${totalFailed} test(s) smoke en échec sur ZotoShop`;
    const details = this.failures
      .slice(0, MAX_FAILURES)
      .map((f) => `• ${f.title}\n  \`${f.error.slice(0, ERROR_TRUNCATE)}\``)
      .join("\n");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `${summary}\n${details}` }),
      });
      if (response.ok) {
        console.log(`📤 Notif Slack envoyée (${totalFailed} échec(s))`);
      } else {
        console.error(
          `❌ Slack webhook HTTP ${response.status} ${response.statusText}`,
        );
      }
    } catch (err) {
      console.error(
        `❌ Slack webhook : ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}

export default TeamNotifReporter;
