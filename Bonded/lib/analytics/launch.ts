export type LaunchChecklistStatus = "complete" | "in_progress" | "blocked";

export type LaunchOverallStatus = "ready" | "stabilizing" | "at_risk";

export interface LaunchChecklistItem {
  id: string;
  label: string;
  status: LaunchChecklistStatus;
  description: string;
  metric?: string;
  impact: "critical" | "high" | "medium" | "low";
}

export interface LaunchSummary {
  status: LaunchOverallStatus;
  confidence: number;
  headline: string;
  supporting: string;
}

export interface LaunchKpi {
  id: string;
  label: string;
  value: string;
  change: number;
  trend: "up" | "down" | "flat";
  description: string;
}

export interface LaunchMarketingHighlight {
  id: string;
  title: string;
  metric: string;
  status: "live" | "planned" | "draft";
  description: string;
  actionLabel?: string;
  actionId?: string;
}

export interface LaunchSupportChannel {
  id: string;
  name: string;
  status: "online" | "standby" | "offline";
  slaMinutes: number;
  description: string;
  contact: string;
}

export interface AnalyticsHealth {
  coverage: number;
  totalSignals: number;
  criticalSignals: number;
  recommendation: string;
}

export interface LaunchOperationalAlert {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  description: string;
  actionLabel: string;
  metric: string;
}

export interface LaunchSnapshot {
  onboardingCompletionRate: number;
  pushOptInRate: number;
  premiumConversionRate: number;
  matchToConversationRate: number;
  waitlistSize: number;
  marketingCtr: number;
  campaignsLive: number;
  analyticsCoverage: number;
  analyticsSignals: number;
  supportResponseMinutes: number;
  incidentsLast24h: number;
  latencyP95: number;
  slowFrameSessions: number;
  offlineSessions: number;
  dailyActiveUsers: number;
  retentionRate: number;
  npsPromoters: number;
  npsDetractors: number;
}

const checklistWeights: Record<LaunchChecklistStatus, number> = {
  complete: 1,
  "in_progress": 0.55,
  blocked: 0,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatPercent(value: number): string {
  return `${Math.round(clamp(value, 0, 1) * 100)}%`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}m`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${Math.round(value)}`;
}

function formatMinutes(value: number): string {
  if (value >= 60) {
    return `${Math.round(value / 60)}h`;
  }
  return `${Math.round(value)}m`;
}

export function evaluateLaunchChecklist(snapshot: LaunchSnapshot): LaunchChecklistItem[] {
  const onboardingStatus: LaunchChecklistStatus =
    snapshot.onboardingCompletionRate >= 0.9
      ? "complete"
      : snapshot.onboardingCompletionRate >= 0.72
        ? "in_progress"
        : "blocked";

  const analyticsStatus: LaunchChecklistStatus =
    snapshot.analyticsCoverage >= 0.85
      ? "complete"
      : snapshot.analyticsCoverage >= 0.65
        ? "in_progress"
        : "blocked";

  const marketingStatus: LaunchChecklistStatus =
    snapshot.waitlistSize >= 4000 && snapshot.campaignsLive >= 2
      ? "complete"
      : snapshot.waitlistSize >= 2500
        ? "in_progress"
        : "blocked";

  const supportStatus: LaunchChecklistStatus =
    snapshot.supportResponseMinutes <= 15
      ? "complete"
      : snapshot.supportResponseMinutes <= 30
        ? "in_progress"
        : "blocked";

  const reliabilityStatus: LaunchChecklistStatus =
    snapshot.incidentsLast24h === 0 && snapshot.latencyP95 <= 250
      ? "complete"
      : snapshot.incidentsLast24h <= 2 && snapshot.latencyP95 <= 320
        ? "in_progress"
        : "blocked";

  return [
    {
      id: "onboarding",
      label: "Onboarding completion",
      status: onboardingStatus,
      description: "Guided wallet → analysis → profile flow readiness",
      metric: formatPercent(snapshot.onboardingCompletionRate),
      impact: "critical",
    },
    {
      id: "analytics",
      label: "Analytics coverage",
      status: analyticsStatus,
      description: "Telemetry coverage across the matchmaking funnel",
      metric: formatPercent(snapshot.analyticsCoverage),
      impact: "high",
    },
    {
      id: "marketing",
      label: "Marketing activation",
      status: marketingStatus,
      description: "Campaigns, waitlist momentum, and referral loops",
      metric: `${formatNumber(snapshot.waitlistSize)} waitlist`,
      impact: "high",
    },
    {
      id: "support",
      label: "Support responsiveness",
      status: supportStatus,
      description: "Concierge, Discord, and support desk coverage",
      metric: formatMinutes(snapshot.supportResponseMinutes),
      impact: "medium",
    },
    {
      id: "reliability",
      label: "Reliability & performance",
      status: reliabilityStatus,
      description: "Incidents, latency, and frame pacing stability",
      metric: `${snapshot.incidentsLast24h} incidents`,
      impact: "critical",
    },
  ];
}

export function resolveLaunchSummary(
  items: LaunchChecklistItem[],
  snapshot: LaunchSnapshot,
): LaunchSummary {
  const score = items.reduce((total, item) => total + checklistWeights[item.status], 0);
  const normalized = score / items.length;

  let status: LaunchOverallStatus = "ready";
  if (items.some((item) => item.status === "blocked")) {
    status = "at_risk";
  } else if (items.filter((item) => item.status === "in_progress").length >= 2) {
    status = "stabilizing";
  }

  const confidence = clamp(normalized, 0, 1);

  const narrativeByStatus: Record<LaunchOverallStatus, string> = {
    ready: "Launch runway is clear. Focus on amplification and retention loops.",
    stabilizing:
      "Core systems are live with minor follow-ups. Prioritize analytics polish and support load balancing.",
    at_risk:
      "Resolve the highlighted blockers before opening the floodgates. Keep go-to-market partners in sync.",
  };

  const headline = (() => {
    if (status === "at_risk") {
      return "Hold launch for operational hardening";
    }
    if (status === "stabilizing") {
      return "Launch-ready with focused follow-ups";
    }
    if (snapshot.premiumConversionRate >= 0.32) {
      return "Premium conversions primed for launch";
    }
    if (snapshot.matchToConversationRate >= 0.55) {
      return "Match-to-chat momentum is healthy";
    }
    return "Launch runway cleared";
  })();

  return {
    status,
    confidence,
    headline,
    supporting: narrativeByStatus[status],
  };
}

function resolveTrend(change: number): "up" | "down" | "flat" {
  if (change > 0.5) {
    return "up";
  }
  if (change < -0.5) {
    return "down";
  }
  return "flat";
}

export function buildLaunchKpis(snapshot: LaunchSnapshot): LaunchKpi[] {
  const retentionDelta = (snapshot.retentionRate - 0.82) * 100;
  const premiumDelta = (snapshot.premiumConversionRate - 0.24) * 100;
  const conversationDelta = (snapshot.matchToConversationRate - 0.48) * 100;
  const pushDelta = (snapshot.pushOptInRate - 0.6) * 100;

  return [
    {
      id: "dau",
      label: "Daily active wallets",
      value: formatNumber(snapshot.dailyActiveUsers),
      change: Math.round(retentionDelta * 10) / 10,
      trend: resolveTrend(retentionDelta),
      description: `Retention rate ${formatPercent(snapshot.retentionRate)}`,
    },
    {
      id: "match_to_chat",
      label: "Match → chat conversion",
      value: formatPercent(snapshot.matchToConversationRate),
      change: Math.round(conversationDelta * 10) / 10,
      trend: resolveTrend(conversationDelta),
      description: "Share of matches activating a conversation in <24h",
    },
    {
      id: "premium_conversion",
      label: "Premium conversion",
      value: formatPercent(snapshot.premiumConversionRate),
      change: Math.round(premiumDelta * 10) / 10,
      trend: resolveTrend(premiumDelta),
      description: "Trial → paid uplift across Base Pay checkouts",
    },
    {
      id: "push_opt_in",
      label: "Push opt-in",
      value: formatPercent(snapshot.pushOptInRate),
      change: Math.round(pushDelta * 10) / 10,
      trend: resolveTrend(pushDelta),
      description: "Users enabling match + message notifications",
    },
  ];
}

export function buildMarketingHighlights(snapshot: LaunchSnapshot): LaunchMarketingHighlight[] {
  const ctrPercent = formatPercent(snapshot.marketingCtr);

  return [
    {
      id: "waitlist",
      title: "Waitlist momentum",
      metric: `${formatNumber(snapshot.waitlistSize)} wallets`,
      status: snapshot.waitlistSize >= 4000 ? "live" : "planned",
      description: "Organic referrals and Base-native partnerships fueling growth.",
      actionLabel: "Sync referral drop",
      actionId: "referral-sync",
    },
    {
      id: "campaigns",
      title: "Campaign performance",
      metric: `${snapshot.campaignsLive} live • ${ctrPercent} CTR`,
      status: snapshot.campaignsLive >= 2 ? "live" : "planned",
      description: "Creator collabs and Farcaster frames primed for launch day.",
      actionLabel: "Review creator brief",
      actionId: "campaign-brief",
    },
    {
      id: "retention",
      title: "Retention loops",
      metric: formatPercent(snapshot.retentionRate),
      status: snapshot.retentionRate >= 0.84 ? "live" : "planned",
      description: "Challenges, streaks, and premium perks keeping couples engaged.",
      actionLabel: "Schedule retention push",
      actionId: "retention-push",
    },
  ];
}

export function buildSupportChannels(snapshot: LaunchSnapshot): LaunchSupportChannel[] {
  return [
    {
      id: "concierge",
      name: "Concierge desk",
      status: snapshot.supportResponseMinutes <= 15 ? "online" : "standby",
      slaMinutes: Math.round(snapshot.supportResponseMinutes),
      description: "1:1 onboarding for premium couples and high-signal users.",
      contact: "concierge@bonded.club",
    },
    {
      id: "discord",
      name: "Discord command center",
      status: snapshot.offlineSessions > 5 ? "standby" : "online",
      slaMinutes: 12,
      description: "Community mods triaging feature requests and vibe checks.",
      contact: "discord.gg/bonded",
    },
    {
      id: "status",
      name: "Status & incident feed",
      status: snapshot.incidentsLast24h === 0 ? "online" : "standby",
      slaMinutes: 5,
      description: "Automated updates routed to X + Warpcast for transparency.",
      contact: "status.bonded.club",
    },
  ];
}

export function evaluateAnalyticsHealth(snapshot: LaunchSnapshot): AnalyticsHealth {
  const coverage = clamp(snapshot.analyticsCoverage, 0, 1);
  const totalSignals = Math.max(0, Math.round(snapshot.analyticsSignals));
  const criticalSignals = Math.round(totalSignals * 0.18);

  const recommendation = coverage >= 0.9
    ? "Analytics coverage exceeds launch bar. Continue monitoring conversion cohorts."
    : coverage >= 0.75
      ? "Backfill remaining funnel events and verify premium upsell attribution."
      : "Prioritize analytics QA before scaling acquisition spend.";

  return {
    coverage,
    totalSignals,
    criticalSignals,
    recommendation,
  };
}

export function deriveOperationalAlerts(
  snapshot: LaunchSnapshot,
  items: LaunchChecklistItem[],
): LaunchOperationalAlert[] {
  const alerts: LaunchOperationalAlert[] = [];

  if (snapshot.latencyP95 > 320 || snapshot.slowFrameSessions > 12) {
    alerts.push({
      id: "performance",
      title: "Tune performance budget",
      severity: snapshot.latencyP95 > 360 ? "high" : "medium",
      description:
        "Verify CDN caching and hydrate critical hero content server-side to tighten P95 latency.",
      actionLabel: "Open runbook",
      metric: `${Math.round(snapshot.latencyP95)}ms p95`,
    });
  }

  if (snapshot.pushOptInRate < 0.55) {
    alerts.push({
      id: "push-opt-in",
      title: "Increase notification opt-in",
      severity: "medium",
      description: "Ship contextual education in onboarding step 4 to boost notification enablement.",
      actionLabel: "Queue experiment",
      metric: formatPercent(snapshot.pushOptInRate),
    });
  }

  const analyticsChecklist = items.find((item) => item.id === "analytics");
  if (analyticsChecklist && analyticsChecklist.status !== "complete") {
    alerts.push({
      id: "analytics",
      title: "Finalize analytics QA",
      severity: analyticsChecklist.status === "blocked" ? "high" : "medium",
      description: "Validate event parity between web, MiniKit, and API interactions before launch.",
      actionLabel: "Run QA script",
      metric: analyticsChecklist.metric ?? formatPercent(snapshot.analyticsCoverage),
    });
  }

  if (snapshot.offlineSessions > 12) {
    alerts.push({
      id: "offline",
      title: "Offline session review",
      severity: "low",
      description: "Audit service worker caching rules to ensure matchmaking data stays fresh post-launch.",
      actionLabel: "Review caching",
      metric: `${snapshot.offlineSessions} sessions`,
    });
  }

  return alerts;
}
