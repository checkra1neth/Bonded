import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import {
  buildSuccessStoryAmplification,
  generateMemeConcepts,
  generatePortfolioRoast,
  trackPortfolioAchievements,
  trackViralContentPerformance,
  type MarketEvent,
  type RelationshipHistory,
} from "../viralContent";
import type { SanitizedPortfolioSnapshot } from "../../portfolio/types";
import type { SharedInterest } from "../../matching/compatibility";

const snapshot: SanitizedPortfolioSnapshot = {
  tokens: [
    { symbol: "ETH", allocationBucket: "dominant", conviction: "high" },
    { symbol: "DEGEN", allocationBucket: "significant", conviction: "medium" },
    { symbol: "AERO", allocationBucket: "diversified" },
  ],
  defiProtocols: [
    { name: "Aerodrome", category: "dex", risk: "adventurous" },
    { name: "Aave", category: "lending", risk: "balanced" },
    { name: "EigenLayer", category: "staking", risk: "balanced" },
  ],
  nftCollections: [
    { name: "BasePaint", theme: "art", vibe: "cypherpunk" },
    { name: "Parallel", theme: "gaming", vibe: "luxury" },
  ],
  activity: {
    timezone: "UTC-05:00",
    activePeriods: ["morning", "evening", "late_night"],
    tradingFrequency: "daily",
    riskTolerance: "adventurous",
  },
  highlights: [
    "Co-founded Base Builders DAO",
    "Grew treasury to seven figures",
    "Ran onchain couples retreat",
  ],
  transactions: null,
};

const history: RelationshipHistory = {
  jointDaoMemberships: ["Base Builders DAO", "Treasury Guild"],
  bearMarketEvents: [
    { name: "2022 liquidity crunch", timeframe: "2022 Q2", severity: "legendary", survived: true },
    { name: "2020 Black Thursday", timeframe: "2020 Q1", severity: "heavy", survived: true },
  ],
  sharedActivations: ["Base Mainnet Launch Party"],
  shippedProjects: ["Base indexer"],
  firstCollaborationDate: new Date("2021-06-01T00:00:00Z"),
  notableWins: ["Won Base hackathon"],
};

const sharedInterests: SharedInterest[] = [
  {
    type: "defi",
    name: "Aerodrome",
    detail: "Coordinated LP rotations",
    insight: "Both manage Aerodrome gauges weekly.",
  },
  {
    type: "token",
    name: "DEGEN",
    detail: "DEGEN tipping spree",
  },
];

const events: MarketEvent[] = [
  {
    title: "Aerodrome incentives rotate",
    summary: "Fresh gauge votes just juiced core pools.",
    sentiment: "bullish",
    timeframe: "24h",
    assets: ["AERO", "DEGEN"],
    catalyst: "Epoch flip",
  },
  {
    title: "BaseBuilders DAO retro",
    summary: "DAO shipping sprint minted viral governance memes.",
    sentiment: "volatile",
    timeframe: "48h",
    assets: ["ETH"],
    catalyst: "Retro funding drop",
  },
  {
    title: "NFT quest weekend",
    summary: "Parallel events bringing players onto Base.",
    sentiment: "bullish",
    timeframe: "72h",
    assets: ["Parallel"],
  },
];

describe("viral content experience", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-10-05T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds coordinated roasts, memes, achievements, and analytics", () => {
    const roast = generatePortfolioRoast(snapshot, { humor: "balanced", targetAlias: "Ava" });
    expect(roast.roasts.length).toBeGreaterThanOrEqual(4);
    expect(roast.opener).toContain("Ava");
    expect(roast.disclaimers[0]).toMatch(/Balances stay private/);

    const achievements = trackPortfolioAchievements({ snapshot, history, sharedInterests });
    const achievementIds = achievements.map((achievement) => achievement.id);
    expect(achievementIds).toContain("joint_dao");
    expect(achievementIds).toContain("bear_market_survivor");
    expect(achievements[0].highlightScore).toBeGreaterThan(achievements.at(-1)?.highlightScore ?? 0);

    const memes = generateMemeConcepts(snapshot, events, {
      maxMemes: 2,
      humor: "balanced",
      trendingHashtags: ["BaseSummer"],
    });
    expect(memes).toHaveLength(2);
    expect(memes[0].overlayText[0]).toMatch(/AERO|DEGEN|ETH|PARALLEL/);
    expect(memes[0].tags).toContain("BaseSummer");

    const plan = buildSuccessStoryAmplification({
      coupleAlias: "Ava + Nova",
      achievements,
      roast,
      memes,
      sharedInterests,
      callToActionUrl: "https://bonded.fun/love",
    });
    expect(plan.headline).toContain("Ava + Nova");
    expect(plan.distributionPlan).toHaveLength(3);
    expect(plan.distributionPlan[0].hashtags).toContain("#Bonded");
    expect(plan.predictedVirality).toBeGreaterThanOrEqual(40);
    expect(plan.shareConfidence).toMatch(/emerging|steady|prime/);

    const analytics = trackViralContentPerformance(
      [
        {
          id: "meme-1",
          type: "meme",
          platform: "warpcast",
          timestamp: new Date("2024-10-05T09:30:00Z"),
          tags: memes[0].tags,
          metrics: {
            impressions: 1400,
            shares: 320,
            clicks: 240,
            saves: 80,
            referrals: 22,
          },
        },
        {
          id: "roast-1",
          type: "roast",
          platform: "x",
          timestamp: new Date("2024-10-05T10:00:00Z"),
          tags: roast.recommendedMemes,
          metrics: {
            impressions: 980,
            shares: 180,
            clicks: 200,
            referrals: 12,
            comments: 45,
            watchTimeSeconds: 90,
          },
        },
        {
          id: "story-1",
          type: "success_story",
          platform: "lens",
          timestamp: new Date("2024-10-05T11:00:00Z"),
          tags: plan.distributionPlan[0].hashtags,
          metrics: {
            impressions: 760,
            shares: 190,
            clicks: 240,
            referrals: 28,
            saves: 95,
            watchTimeSeconds: 140,
          },
        },
      ],
      { timeframeHours: 48, targetViralityScore: 85 },
    );

    expect(analytics.eventsAnalyzed).toBe(3);
    expect(analytics.totalImpressions).toBe(3140);
    expect(analytics.shareRate).toBeCloseTo(0.22, 2);
    expect(analytics.clickThroughRate).toBeGreaterThan(0.18);
    expect(analytics.momentum.classification).toBe("surging");
    expect(analytics.momentum.trendingTags.length).toBeGreaterThan(0);
    expect(analytics.recommendations[0]).toMatch(/spicier roast/i);
  });
});
