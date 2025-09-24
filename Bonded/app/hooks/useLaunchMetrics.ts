"use client";

import { useCallback, useMemo, useState } from "react";

import type { MatchQueueState } from "@/lib/matching/queue";
import {
  buildLaunchKpis,
  buildMarketingHighlights,
  buildSupportChannels,
  deriveOperationalAlerts,
  evaluateAnalyticsHealth,
  evaluateLaunchChecklist,
  resolveLaunchSummary,
  type AnalyticsHealth,
  type LaunchChecklistItem,
  type LaunchKpi,
  type LaunchMarketingHighlight,
  type LaunchOperationalAlert,
  type LaunchSnapshot,
  type LaunchSummary,
  type LaunchSupportChannel,
} from "@/lib/analytics/launch";
import { useAnalytics } from "./useAnalytics";

type FeedbackSentiment = "positive" | "neutral" | "negative";

export interface FeedbackInsights {
  total: number;
  promoters: number;
  detractors: number;
  npsScore: number;
  opportunities: number;
}

export interface UseLaunchMetricsOptions {
  queueState: MatchQueueState;
  positiveMatchCount: number;
  superLikeCount: number;
  mutualMatchCount: number;
  premiumActive: boolean;
  premiumCheckoutCount: number;
  push: {
    supported: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
  };
  serviceWorker: {
    ready: boolean;
    updateAvailable: boolean;
  };
  online: boolean;
  performance: {
    slowFrameCount: number;
    lastFrameDuration?: number;
  };
  marketingEvents: {
    accessible: number;
    locked: number;
  };
  analytics: {
    totalEvents: number;
    eventsByCategory: Record<string, number>;
  };
  baselineWaitlist?: number;
  initialFeedback?: {
    total: number;
    promoters: number;
    detractors: number;
  };
}

export interface UseLaunchMetricsResult {
  summary: LaunchSummary;
  checklist: LaunchChecklistItem[];
  kpis: LaunchKpi[];
  marketingHighlights: LaunchMarketingHighlight[];
  supportChannels: LaunchSupportChannel[];
  analyticsHealth: AnalyticsHealth;
  operations: LaunchOperationalAlert[];
  feedback: FeedbackInsights;
  registerFeedback: (sentiment: FeedbackSentiment) => void;
  trackAction: (actionId: string, metadata?: Record<string, unknown>) => void;
  trackSupport: (channelId: string) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const DEFAULT_FEEDBACK = { total: 26, promoters: 18, detractors: 3 };

export function useLaunchMetrics(options: UseLaunchMetricsOptions): UseLaunchMetricsResult {
  const { trackEvent } = useAnalytics();

  const [feedbackStats, setFeedbackStats] = useState(() => ({
    total: options.initialFeedback?.total ?? DEFAULT_FEEDBACK.total,
    promoters: options.initialFeedback?.promoters ?? DEFAULT_FEEDBACK.promoters,
    detractors: options.initialFeedback?.detractors ?? DEFAULT_FEEDBACK.detractors,
  }));

  const registerFeedback = useCallback((sentiment: FeedbackSentiment) => {
    setFeedbackStats((current) => {
      const next = { ...current, total: current.total + 1 };
      if (sentiment === "positive") {
        next.promoters += 1;
      } else if (sentiment === "negative") {
        next.detractors += 1;
      }
      return next;
    });

    trackEvent({
      name: "feedback.submitted",
      category: "feedback",
      properties: { sentiment },
    });
  }, [trackEvent]);

  const trackAction = useCallback(
    (actionId: string, metadata?: Record<string, unknown>) => {
      trackEvent({
        name: "launch.action",
        category: "operations",
        properties: { actionId, ...metadata },
      });
    },
    [trackEvent],
  );

  const trackSupport = useCallback(
    (channelId: string) => {
      trackEvent({
        name: "support.channel_opened",
        category: "support",
        properties: { channelId },
      });
    },
    [trackEvent],
  );

  const snapshot = useMemo<LaunchSnapshot>(() => {
    const reviewed = options.queueState.decisions.length;
    const totalEntries = options.queueState.entries.length || 1;
    const positiveRatio = options.positiveMatchCount
      ? options.mutualMatchCount / options.positiveMatchCount
      : 0;
    const onboardingCompletionRate = clamp(reviewed / totalEntries + 0.05, 0, 0.98);

    const pushOptInRate = (() => {
      if (!options.push.supported) {
        return 0.28;
      }
      if (options.push.permission === "granted") {
        return options.push.subscribed ? 0.84 : 0.68;
      }
      if (options.push.permission === "denied") {
        return 0.38;
      }
      return 0.58;
    })();

    const premiumBase = options.premiumActive ? 0.33 : 0.24;
    const premiumConversionRate = clamp(
      premiumBase + Math.min(0.06, options.superLikeCount * 0.012 + options.premiumCheckoutCount * 0.01),
      0,
      0.45,
    );

    const matchToConversationRate = clamp(0.38 + positiveRatio * 0.55, 0, 0.82);

    const waitlistSize = (options.baselineWaitlist ?? 4200)
      + reviewed * 18
      + options.marketingEvents.accessible * 64;

    const marketingCtr = clamp(
      0.16
        + (options.marketingEvents.accessible / Math.max(4, options.marketingEvents.accessible + options.marketingEvents.locked))
          * 0.09,
      0.14,
      0.34,
    );

    const campaignsLive = Math.max(
      1,
      Math.min(3, Math.round(options.marketingEvents.accessible / 2) + 1),
    );

    const operationsSignals = options.analytics.eventsByCategory.operations ?? 0;
    const feedbackSignals = options.analytics.eventsByCategory.feedback ?? 0;

    const expectedEvents = Math.max(
      40,
      reviewed * 4 + options.mutualMatchCount * 3 + (options.premiumActive ? 10 : 0),
    );
    const analyticsCoverage = clamp(options.analytics.totalEvents / expectedEvents, 0, 1);

    let supportResponseMinutes = 12;
    if (!options.online) {
      supportResponseMinutes += 6;
    }
    if (options.serviceWorker.updateAvailable) {
      supportResponseMinutes += 3;
    }
    if (!options.serviceWorker.ready) {
      supportResponseMinutes += 4;
    }

    const incidentsLast24h = (!options.online ? 1 : 0)
      + (options.serviceWorker.updateAvailable ? 1 : 0)
      + (operationsSignals > 6 ? 1 : 0);

    const latencyP95 = 210
      + Math.max(0, (options.performance.lastFrameDuration ?? 0) - 48)
      + Math.max(0, options.performance.slowFrameCount - 4) * 6;

    const slowFrameSessions = Math.max(0, options.performance.slowFrameCount - 2);

    const offlineBase = Math.max(3, Math.round((1 - pushOptInRate) * 14));
    const offlineSessions = options.online
      ? Math.max(3, offlineBase - Math.min(3, Math.floor(operationsSignals / 6)))
      : 18;

    const dailyActiveUsers = 1480
      + reviewed * 12
      + options.marketingEvents.accessible * 28
      + options.mutualMatchCount * 8
      + feedbackSignals * 2;

    const retentionRate = clamp(
      0.82 + options.mutualMatchCount * 0.012 - (offlineSessions > 12 ? 0.03 : 0),
      0.74,
      0.95,
    );

    return {
      onboardingCompletionRate,
      pushOptInRate,
      premiumConversionRate,
      matchToConversationRate,
      waitlistSize,
      marketingCtr,
      campaignsLive,
      analyticsCoverage,
      analyticsSignals: options.analytics.totalEvents,
      supportResponseMinutes,
      incidentsLast24h,
      latencyP95,
      slowFrameSessions,
      offlineSessions,
      dailyActiveUsers,
      retentionRate,
      npsPromoters: feedbackStats.promoters,
      npsDetractors: feedbackStats.detractors,
    } satisfies LaunchSnapshot;
  }, [
    options.analytics.eventsByCategory.feedback,
    options.analytics.eventsByCategory.operations,
    options.analytics.totalEvents,
    options.baselineWaitlist,
    options.marketingEvents.accessible,
    options.marketingEvents.locked,
    options.mutualMatchCount,
    options.online,
    options.performance.lastFrameDuration,
    options.performance.slowFrameCount,
    options.premiumActive,
    options.premiumCheckoutCount,
    options.positiveMatchCount,
    options.push.permission,
    options.push.subscribed,
    options.push.supported,
    options.queueState.decisions.length,
    options.queueState.entries.length,
    options.serviceWorker.ready,
    options.serviceWorker.updateAvailable,
    options.superLikeCount,
    feedbackStats.detractors,
    feedbackStats.promoters,
  ]);

  const checklist = useMemo(() => evaluateLaunchChecklist(snapshot), [snapshot]);

  const summary = useMemo(() => resolveLaunchSummary(checklist, snapshot), [checklist, snapshot]);

  const kpis = useMemo(() => buildLaunchKpis(snapshot), [snapshot]);

  const marketingHighlights = useMemo(
    () => buildMarketingHighlights(snapshot),
    [snapshot],
  );

  const supportChannels = useMemo(() => buildSupportChannels(snapshot), [snapshot]);

  const analyticsHealth = useMemo(() => evaluateAnalyticsHealth(snapshot), [snapshot]);

  const operations = useMemo(
    () => deriveOperationalAlerts(snapshot, checklist),
    [snapshot, checklist],
  );

  const feedback = useMemo<FeedbackInsights>(() => {
    const opportunities = Math.max(0, feedbackStats.total - feedbackStats.promoters);
    const npsScore = feedbackStats.total
      ? Math.round(((feedbackStats.promoters - feedbackStats.detractors) / feedbackStats.total) * 100)
      : 0;

    return {
      total: feedbackStats.total,
      promoters: feedbackStats.promoters,
      detractors: feedbackStats.detractors,
      opportunities,
      npsScore,
    };
  }, [feedbackStats]);

  return {
    summary,
    checklist,
    kpis,
    marketingHighlights,
    supportChannels,
    analyticsHealth,
    operations,
    feedback,
    registerFeedback,
    trackAction,
    trackSupport,
  };
}
