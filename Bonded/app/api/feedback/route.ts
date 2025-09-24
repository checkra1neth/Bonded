import { NextResponse } from "next/server";
import { z } from "zod";

import { logger } from "../../../lib/observability/logger";
import { telemetry } from "../../../lib/observability/telemetry";

const feedbackSchema = z.object({
  name: z.string().max(80).optional(),
  contact: z.string().max(160).optional(),
  topic: z.enum(["onboarding", "matching", "premium", "support", "bug"]).default("matching"),
  sentiment: z.enum(["positive", "neutral", "negative"]).default("neutral"),
  message: z.string().min(8).max(2000),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    const result = feedbackSchema.safeParse(payload);

    if (!result.success) {
      logger.warn("Rejected feedback submission", { issues: result.error.issues });
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const feedback = result.data;

    telemetry.trackEvent({
      name: "feedback.received",
      distinctId: "client",
      properties: {
        topic: feedback.topic,
        sentiment: feedback.sentiment,
      },
    });

    if (feedback.sentiment === "negative") {
      telemetry.trackError({
        name: "feedback.negative",
        message: feedback.message.slice(0, 140),
        severity: "warning",
        context: {
          topic: feedback.topic,
          contact: feedback.contact,
        },
      });
    }

    logger.info("Launch feedback captured", {
      topic: feedback.topic,
      sentiment: feedback.sentiment,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Failed to capture feedback", { error: message });
    telemetry.trackError({
      name: "feedback.capture_failed",
      message,
      severity: "error",
      context: { endpoint: "feedback" },
    });
    return NextResponse.json({ error: "Failed to capture feedback" }, { status: 500 });
  }
}
