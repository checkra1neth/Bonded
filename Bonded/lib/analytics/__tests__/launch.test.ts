import { describe, expect, it } from "vitest";

import {
  buildLaunchKpis,
  buildMarketingHighlights,
  buildSupportChannels,
  deriveOperationalAlerts,
  evaluateAnalyticsHealth,
  evaluateLaunchChecklist,
  resolveLaunchSummary,
  type LaunchSnapshot,
} from "../launch";

const snapshot: LaunchSnapshot = {
  onboardingCompletionRate: 0.94,
  pushOptInRate: 0.72,
  premiumConversionRate: 0.31,
  matchToConversationRate: 0.58,
  waitlistSize: 4820,
  marketingCtr: 0.19,
  campaignsLive: 3,
  analyticsCoverage: 0.88,
  analyticsSignals: 912,
  supportResponseMinutes: 12,
  incidentsLast24h: 0,
  latencyP95: 228,
  slowFrameSessions: 6,
  offlineSessions: 4,
  dailyActiveUsers: 1680,
  retentionRate: 0.87,
  npsPromoters: 24,
  npsDetractors: 4,
};

describe("launch analytics", () => {
  it("evaluates checklist readiness with detailed metrics", () => {
    const checklist = evaluateLaunchChecklist(snapshot);

    expect(checklist).toHaveLength(5);
    const onboarding = checklist.find((item) => item.id === "onboarding");
    expect(onboarding).toBeDefined();
    expect(onboarding?.status).toBe("complete");
    expect(onboarding?.metric).toBe("94%");

    const marketing = checklist.find((item) => item.id === "marketing");
    expect(marketing?.status).toBe("complete");
    expect(marketing?.metric).toContain("waitlist");
  });

  it("resolves launch summary narrative from checklist + metrics", () => {
    const checklist = evaluateLaunchChecklist(snapshot);
    const summary = resolveLaunchSummary(checklist, snapshot);

    expect(summary.status).toBe("ready");
    expect(summary.headline.length).toBeGreaterThan(0);
    expect(summary.headline).toMatch(/(Launch|momentum)/i);
    expect(summary.confidence).toBeGreaterThan(0.85);
  });

  it("builds KPI, marketing, and support insights", () => {
    const kpis = buildLaunchKpis(snapshot);
    expect(kpis).toHaveLength(4);
    expect(kpis.map((item) => item.id)).toContain("premium_conversion");
    expect(kpis.find((item) => item.id === "dau")?.value).toBe("1.7k");

    const marketingHighlights = buildMarketingHighlights(snapshot);
    expect(marketingHighlights).toHaveLength(3);
    expect(marketingHighlights[0].status).toBe("live");

    const supportChannels = buildSupportChannels(snapshot);
    expect(supportChannels.map((channel) => channel.name)).toContain("Concierge desk");
  });

  it("generates analytics health and operational alerts when thresholds degrade", () => {
    const coverage = evaluateAnalyticsHealth({ ...snapshot, analyticsCoverage: 0.7 });
    expect(coverage.coverage).toBeCloseTo(0.7);
    expect(coverage.recommendation).toMatch(/Backfill|Prioritize/);

    const degraded = { ...snapshot, latencyP95: 360, pushOptInRate: 0.42, offlineSessions: 18 };
    const checklist = evaluateLaunchChecklist({ ...degraded, analyticsCoverage: 0.5 });
    const alerts = deriveOperationalAlerts(degraded, checklist);
    expect(alerts.map((alert) => alert.id)).toEqual(
      expect.arrayContaining(["performance", "push-opt-in", "analytics", "offline"]),
    );
  });
});
