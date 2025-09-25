import { logger } from "./logger";
import { getServerEnv } from "../config/env";

let isInitialized = false;

export async function initializeObservability() {
  if (isInitialized) {
    return;
  }

  isInitialized = true;
  const env = getServerEnv();
  logger.info("Observability initialized", {
    environment: env.NODE_ENV,
    logEndpointConfigured: Boolean(env.MONITORING_LOGTAIL_SOURCE_TOKEN),
    analyticsConfigured: Boolean(env.ANALYTICS_POSTHOG_API_KEY),
  });
}
