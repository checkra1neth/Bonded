import { describe, expect, it } from "vitest";

import {
  createCompatibilityAnalysisRecord,
  mapCategoryToEnum,
  toCompatibilityPersistence,
} from "../analysis";
import { DEFAULT_PRIVACY_PREFERENCES } from "../privacy";
import type { PortfolioSnapshot } from "../types";
import type { CompatibilityScore, SharedInterest } from "../../matching/compatibility";

const snapshot: PortfolioSnapshot = {
  tokens: [
    { symbol: "ETH", allocation: 0.55, conviction: "high" },
    { symbol: "CBETH", allocation: 0.25 },
    { symbol: "AERO", allocation: 0.2 },
  ],
  defiProtocols: [
    { name: "Aave", category: "lending", risk: "balanced" },
    { name: "Aerodrome", category: "dex", risk: "adventurous" },
  ],
  nftCollections: [
    { name: "BasePaint", theme: "art", vibe: "cypherpunk" },
  ],
  activity: {
    timezoneOffset: -5,
    activeHours: [9, 10, 21, 22],
    tradingFrequency: "daily",
    riskTolerance: "adventurous",
  },
  highlights: ["Eth maxi with Base yield focus"],
};

const rawScore: CompatibilityScore = {
  overall: 1.2,
  tokenSimilarity: 1.1,
  defiCompatibility: 0.82,
  nftAlignment: -0.1,
  activitySync: 0.74,
  category: {
    id: "crypto_soulmates",
    label: "Crypto Soulmates",
    description: "Perfect alignment",
    minScore: 0.95,
    highlight: "Practically sharing a cold wallet",
  },
  reasoning: ["Shared conviction in ETH", "Shared conviction in ETH", "Mutual late-night trading"],
  factors: [
    { id: "token", label: "Token Alignment", weight: 0.6, score: 1.3, summary: "Heavy ETH overlap" },
    { id: "defi", label: "DeFi Strategy", weight: 0.25, score: 0.9, summary: "Similar Base yields" },
    { id: "nft", label: "NFT Culture", weight: 0.1, score: 0.2, summary: "Art appreciation" },
    { id: "activity", label: "Activity Sync", weight: 0.05, score: 0.7, summary: "Night owls" },
  ],
};

const sharedInterests: SharedInterest[] = [
  { type: "token", name: "ETH", detail: "ETH anchor", insight: "Both overweight ETH" },
  { type: "token", name: "ETH", detail: "ETH anchor", insight: "Duplicate interest" },
  { type: "defi", name: "Aave", detail: "Aave lending", insight: "Matching collateral strategy" },
];

describe("createCompatibilityAnalysisRecord", () => {
  it("sanitizes portfolio details and normalizes scores", () => {
    const record = createCompatibilityAnalysisRecord({
      ownerId: "user-1",
      portfolioId: "portfolio-1",
      targetUserId: "user-2",
      snapshot,
      score: rawScore,
      sharedInterests,
      privacy: { tokenVisibility: "SUMMARY" },
    });

    expect(record.id).toMatch(/^analysis_/);
    expect(record.snapshot.tokens).toHaveLength(3);
    expect(record.snapshot.tokens[0]).not.toHaveProperty("allocation");
    expect(record.snapshot.defiProtocols.length).toBeLessThanOrEqual(5);
    expect(record.sharedInterests).toHaveLength(2);
    expect(record.score.overall).toBeCloseTo(0.842, 3);
    expect(record.score.tokenSimilarity).toBe(1);
    expect(record.score.nftAlignment).toBe(0);
    expect(record.score.reasoning).toEqual([
      "Shared conviction in ETH",
      "Mutual late-night trading",
    ]);
    expect(record.createdAt.getTime()).toBeLessThanOrEqual(record.updatedAt.getTime());
  });
});

describe("toCompatibilityPersistence", () => {
  it("maps an analysis record into a persistence friendly shape", () => {
    const record = createCompatibilityAnalysisRecord({
      ownerId: "user-1",
      portfolioId: "portfolio-1",
      targetUserId: "user-2",
      snapshot,
      score: rawScore,
      sharedInterests,
      privacy: DEFAULT_PRIVACY_PREFERENCES,
      id: "analysis_custom",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });

    const persistence = toCompatibilityPersistence(record);

    expect(persistence.id).toBe("analysis_custom");
    expect(persistence.category).toBe("CRYPTO_SOULMATES");
    expect(persistence.targetUserId).toBe("user-2");
    expect(persistence.overallScore).toBe(record.score.overall);
    expect(persistence.highlights).toEqual(record.snapshot.highlights);
    expect(persistence.sharedInterests).toHaveLength(2);
    expect(persistence.reasoning).toEqual(record.score.reasoning);
  });
});

describe("mapCategoryToEnum", () => {
  it("converts lowercase identifiers into Prisma enum values", () => {
    expect(mapCategoryToEnum("crypto_soulmates")).toBe("CRYPTO_SOULMATES");
    expect(mapCategoryToEnum("potential_match")).toBe("POTENTIAL_MATCH");
    expect(mapCategoryToEnum("defi_compatible")).toBe("DEFI_COMPATIBLE");
    expect(mapCategoryToEnum("different_strategies")).toBe("DIFFERENT_STRATEGIES");
  });
});
