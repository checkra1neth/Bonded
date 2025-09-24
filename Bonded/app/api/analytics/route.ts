import { NextResponse } from "next/server";
import { z } from "zod";

import { logger } from "../../../lib/observability/logger";
import { telemetry } from "../../../lib/observability/telemetry";

const analyticsEventSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(80),
  distinctId: z.string().min(1).max(120).optional(),
  properties: z
    .record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    const result = analyticsEventSchema.safeParse(payload);

    if (!result.success) {
      logger.warn("Invalid analytics payload", { issues: result.error.issues });
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const event = result.data;
    const name = event.name.startsWith("client.") ? event.name : `client.${event.name}`;

    telemetry.trackEvent({
      name,
      distinctId: event.distinctId ?? "anonymous", 
      properties: {
        category: event.category,
        source: "client",
        ...event.properties,
      },
    });

    logger.debug("Analytics event accepted", {
      name,
      category: event.category,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Failed to process analytics event", { error: message });
    telemetry.trackError({
      name: "analytics.ingest_failed",
      message,
      severity: "error",
      context: { endpoint: "analytics" },
    });
    return NextResponse.json({ error: "Analytics ingest failed" }, { status: 500 });
  }
}
