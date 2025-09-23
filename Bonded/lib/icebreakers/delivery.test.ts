import { describe, expect, it } from "vitest";

import { buildMatchCandidate } from "../matching/compatibility";
import type { CompatibilityProfile } from "../matching/compatibility";
import type { MutualMatch } from "../matching/queue";
import { assessPersonality } from "../personality/assessment";

import { deliverIcebreakerSuggestions } from "./delivery";
import { buildMarketInsights } from "./market";
import { assignIcebreakerVariant, getVariantConfig } from "./experiments";

describe("icebreaker delivery", () => {
  const seekerProfile: CompatibilityProfile = {
    user: {
      id: "seeker",
      displayName: "Ava Protocol",
      personality: "DeFi Degen",
    },
    portfolio: {
      tokens: [
        { symbol: "ETH", allocation: 0.32 },
        { symbol: "DEGEN", allocation: 0.2 },
        { symbol: "AERO", allocation: 0.18 },
      ],
      defiProtocols: [
        { name: "Aave", category: "lending", risk: "balanced" },
        { name: "Aerodrome", category: "dex", risk: "adventurous" },
      ],
      nftCollections: [
        { name: "BasePaint", theme: "art" },
      ],
      activity: {
        timezoneOffset: -5,
        activeHours: [8, 9, 10, 20, 21],
        tradingFrequency: "daily",
        riskTolerance: "adventurous",
      },
      highlights: ["Runs a weekly governance call"],
    },
  } satisfies CompatibilityProfile;

  const candidateProfile: CompatibilityProfile = {
    user: {
      id: "nova-yield",
      displayName: "Nova Yield",
      personality: "Banker",
    },
    portfolio: {
      tokens: [
        { symbol: "ETH", allocation: 0.3 },
        { symbol: "DEGEN", allocation: 0.22 },
        { symbol: "AERO", allocation: 0.16 },
      ],
      defiProtocols: [
        { name: "Aave", category: "lending", risk: "balanced" },
        { name: "Aerodrome", category: "dex", risk: "adventurous" },
      ],
      nftCollections: [
        { name: "BasePaint", theme: "art" },
      ],
      activity: {
        timezoneOffset: 0,
        activeHours: [9, 10, 11, 20],
        tradingFrequency: "daily",
        riskTolerance: "balanced",
      },
      highlights: ["Architected a cross-chain vault"],
    },
  } satisfies CompatibilityProfile;

  const seekerAssessment = assessPersonality(seekerProfile.portfolio);
  const matchCandidate = buildMatchCandidate(seekerProfile, candidateProfile);
  const match: MutualMatch = {
    id: "match_nova",
    candidateId: matchCandidate.user.id,
    displayName: matchCandidate.user.displayName,
    decision: "super",
    response: "like",
    createdAt: Date.now(),
    categoryId: matchCandidate.compatibilityScore.category.id,
    compatibilityScore: matchCandidate.compatibilityScore.overall,
  };

  it("generates icebreaker suggestions with variant metadata", async () => {
    const result = await deliverIcebreakerSuggestions({
      seekerProfile,
      seekerPersonality: seekerAssessment,
      candidate: matchCandidate,
      candidatePortfolio: candidateProfile.portfolio,
      match,
      variant: "beta",
    });

    expect(result.variant).toBe("beta");
    expect(result.variantConfig.maxResults).toBeGreaterThan(0);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.length).toBeLessThanOrEqual(result.variantConfig.maxResults);
    expect(result.marketInsights.length).toBeGreaterThan(0);
    expect(
      result.marketInsights.some((insight) =>
        (insight.assets ?? []).some((asset) => asset.toLowerCase().includes("aero")),
      ),
    ).toBe(true);
  });

  it("derives market insights from shared interests", () => {
    const insights = buildMarketInsights({
      sharedInterests: matchCandidate.sharedInterests,
      seekerPortfolio: seekerProfile.portfolio,
      candidatePortfolio: candidateProfile.portfolio,
      maxInsights: 3,
    });

    expect(insights.length).toBeGreaterThan(0);
    const titles = new Set(insights.map((insight) => insight.title));
    expect(titles.size).toBe(insights.length);
    expect(
      insights.some((insight) =>
        insight.title.includes("Aerodrome") ||
        (insight.assets ?? []).some((asset) => asset.includes("DEGEN")),
      ),
    ).toBe(true);
  });

  it("assigns stable variants for the same seed", () => {
    const seed = `${match.id}:${match.candidateId}`;
    expect(assignIcebreakerVariant(seed)).toBe(assignIcebreakerVariant(seed));
    const alphaConfig = getVariantConfig("alpha");
    const betaConfig = getVariantConfig("beta");
    expect(betaConfig.maxResults).toBeGreaterThan(alphaConfig.maxResults);
  });
});
