import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from "@playwright/test/reporter";

interface FailedTest {
  title: string;
  error: string;
}

class TeamNotifsReporter implements Reporter {
  private failedTests: FailedTest[] = [];
  private startTime: number = 0;
  private totalTests: number = 0;
  private passedTests: number = 0;

  onBegin(config: FullConfig, suite: Suite) {
    this.startTime = Date.now();
    this.totalTests = suite.allTests().length;
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // Compter les tests passés
    if (result.status === "passed") {
      this.passedTests++;
    }

    // Détecter tous les échecs (tous tags confondus)
    if (result.status === "failed") {
      // Limiter à 8 échecs
      if (this.failedTests.length < 8) {
        const rawError = result.error?.message || "Erreur inconnue";

        // Nettoyer les codes ANSI
        const cleanError = rawError.replace(/\[[0-9;]*m/g, "");

        // Tronquer à 160 caractères
        const truncatedError =
          cleanError.length > 160
            ? cleanError.substring(0, 160) + "..."
            : cleanError;

        this.failedTests.push({
          title: test.title,
          error: truncatedError,
        });
      }
    }
  }

  async onEnd(result: FullResult) {
    const failedCount = this.failedTests.length;

    // Silencieux si aucun échec
    if (failedCount === 0) {
      return;
    }

    const teamsWebhook = process.env.TEAMS_WEBHOOK_URL;
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;

    // Silencieux si aucune URL configurée
    if (!teamsWebhook && !slackWebhook) {
      return;
    }

    const duration = Math.round((Date.now() - this.startTime) / 1000);
    const env = process.env.ENV_NAME || "LOCAL";
    const branch = process.env.GITHUB_REF_NAME || "local";
    const githubRepo = process.env.GITHUB_REPOSITORY;
    const githubRunId = process.env.GITHUB_RUN_ID;

    // Envoyer sur Teams si configuré
    if (teamsWebhook) {
      await this.sendTeamsNotification(
        teamsWebhook,
        failedCount,
        duration,
        env,
        branch,
        githubRepo,
        githubRunId,
      );
    }

    // Envoyer sur Slack si configuré
    if (slackWebhook) {
      await this.sendSlackNotification(
        slackWebhook,
        failedCount,
        duration,
        env,
        branch,
        githubRepo,
        githubRunId,
      );
    }
  }

  private async sendTeamsNotification(
    webhook: string,
    failedCount: number,
    duration: number,
    env: string,
    branch: string,
    githubRepo?: string,
    githubRunId?: string,
  ) {
    const hasMore = this.failedTests.length === 8;
    const subtitle = `${this.passedTests} passés / ${this.totalTests} total`;

    // Construire la section des échecs
    const failureDetails = this.failedTests
      .map((test) => {
        return `**${test.title}**\n\n\`\`\`\n${test.error}\n\`\`\``;
      })
      .join("\n\n---\n\n");

    const card: any = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      themeColor: "D00000",
      summary: `${failedCount} test(s) en échec`,
      sections: [
        {
          activityTitle: `🚨 ${failedCount} test(s) en échec sur ZotoShop`,
          activitySubtitle: subtitle,
          facts: [
            {
              name: "Environnement",
              value: env,
            },
            {
              name: "Branche",
              value: branch,
            },
            {
              name: "Durée",
              value: `${duration}s`,
            },
            {
              name: "Résultat",
              value: `❌ ${failedCount} échec(s)${hasMore ? " (max 8 listés)" : ""}`,
            },
          ],
        },
        {
          activityTitle: "📋 Détails des échecs",
          text: failureDetails,
        },
      ],
    };

    // Ajouter le bouton GitHub si les variables sont définies
    if (githubRepo && githubRunId) {
      const runUrl = `https://github.com/${githubRepo}/actions/runs/${githubRunId}`;
      card.potentialAction = [
        {
          "@type": "OpenUri",
          name: "🔗 Voir le run GitHub",
          targets: [
            {
              os: "default",
              uri: runUrl,
            },
          ],
        },
      ];
    }

    try {
      const response = await fetch(webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(card),
      });

      if (response.ok) {
        console.log("📤 Notif Teams envoyée");
      } else {
        console.error(
          `❌ Erreur Teams: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi Teams:", error);
    }
  }

  private async sendSlackNotification(
    webhook: string,
    failedCount: number,
    duration: number,
    env: string,
    branch: string,
    githubRepo?: string,
    githubRunId?: string,
  ) {
    const hasMore = this.failedTests.length === 8;

    // Construire le message simple
    let message = `🚨 ${failedCount} test(s) en échec sur ZotoShop\n`;
    message += `${this.passedTests} passés / ${this.totalTests} total\n\n`;
    message += `Environnement: ${env}\n`;
    message += `Branche: ${branch}\n`;
    message += `Durée: ${duration}s\n\n`;
    message += `Échecs${hasMore ? " (max 8 listés)" : ""}:\n`;

    this.failedTests.forEach((test, index) => {
      message += `\n${index + 1}. ${test.title}\n`;
      message += `   ${test.error}\n`;
    });

    if (githubRepo && githubRunId) {
      const runUrl = `https://github.com/${githubRepo}/actions/runs/${githubRunId}`;
      message += `\n🔗 Voir le run: ${runUrl}`;
    }

    try {
      const response = await fetch(webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: message }),
      });

      if (response.ok) {
        console.log("📤 Notif Slack envoyée");
      } else {
        console.error(
          `❌ Erreur Slack: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi Slack:", error);
    }
  }
}

export default TeamNotifsReporter;
