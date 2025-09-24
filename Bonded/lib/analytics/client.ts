export interface AnalyticsEventInput {
  name: string;
  category: string;
  properties?: Record<string, unknown>;
  distinctId?: string;
}

const ANALYTICS_ENDPOINT = "/api/analytics";

function createPayload(event: AnalyticsEventInput) {
  return JSON.stringify({
    ...event,
    timestamp: new Date().toISOString(),
  });
}

export async function sendAnalyticsEvent(event: AnalyticsEventInput): Promise<void> {
  const payload = createPayload(event);

  const supportsBeacon =
    typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function";

  if (supportsBeacon) {
    try {
      const blob = new Blob([payload], { type: "application/json" });
      const delivered = navigator.sendBeacon(ANALYTICS_ENDPOINT, blob);
      if (delivered) {
        return;
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "test") {
        console.warn("Failed to deliver analytics event via beacon", error);
      }
    }
  }

  if (typeof fetch !== "function") {
    return;
  }

  try {
    await fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("Failed to deliver analytics event", error);
    }
  }
}
