import { logger } from "./logger";
import { getServerEnv } from "../config/env";

type TelemetryEvent = {
  name: string;
  distinctId?: string;
  properties?: Record<string, unknown>;
};

type TelemetryError = {
  name: string;
  message: string;
  severity: "warning" | "error" | "critical";
  stack?: string;
  context?: Record<string, unknown>;
};

const POSTHOG_TIMEOUT_MS = 1500;

class TelemetryClient {
  private readonly posthogKey: string | undefined;
  private readonly posthogHost: string;
  private readonly errorWebhook: string | undefined;

  constructor() {
    const env = getServerEnv();
    this.posthogKey = env.ANALYTICS_POSTHOG_API_KEY?.trim();
    this.posthogHost = env.ANALYTICS_POSTHOG_HOST?.trim() || "https://app.posthog.com";
    this.errorWebhook = env.ERROR_WEBHOOK_URL?.trim();
  }

  trackEvent(event: TelemetryEvent) {
    if (!this.posthogKey || typeof fetch !== "function") {
      return;
    }

    const payload = {
      api_key: this.posthogKey,
      event: event.name,
      distinct_id: event.distinctId ?? "anonymous",
      properties: {
        $lib: "bonded-app",
        ...event.properties,
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), POSTHOG_TIMEOUT_MS);

    void fetch(`${this.posthogHost.replace(/\/$/, "")}/capture/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      keepalive: true,
    })
      .catch((error) => {
        if (process.env.NODE_ENV !== "test") {
          logger.warn("Failed to deliver analytics event", {
            error: error instanceof Error ? error.message : String(error),
            event: event.name,
          });
        }
      })
      .finally(() => {
        clearTimeout(timeout);
      });
  }

  trackError(error: TelemetryError) {
    if (!this.errorWebhook || typeof fetch !== "function") {
      return;
    }

    const contextSummary =
      error.context && Object.keys(error.context).length > 0
        ? JSON.stringify(error.context, null, 2).slice(0, 1900)
        : null;

    const contextBlock = contextSummary
      ? {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Context*\n\n```\n" + contextSummary + "\n```",
          },
        }
      : null;

    const stackBlock = error.stack
      ? {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "\n\n```\n" + error.stack.slice(0, 1500) + "\n```",
          },
        }
      : null;

    const body = {
      text: `:warning: ${error.name} (${error.severity}) - ${error.message}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${error.name}* (${error.severity})\n${error.message}`,
          },
        },
        contextBlock,
        stackBlock,
      ].filter(Boolean),
    };

    void fetch(this.errorWebhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch((webhookError) => {
      if (process.env.NODE_ENV !== "test") {
        logger.warn("Failed to deliver error webhook", {
          error: webhookError instanceof Error ? webhookError.message : String(webhookError),
          name: error.name,
        });
      }
    });

    this.trackEvent({
      name: `error:${error.name}`,
      distinctId: "system",
      properties: {
        severity: error.severity,
      },
    });
  }
}

export const telemetry = new TelemetryClient();
