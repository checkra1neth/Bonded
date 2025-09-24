import { describe, expect, it } from "vitest";

import {
  optimizeCandidateSeeds,
  resolveOptimizationIntent,
  type CandidateSeed,
} from "../optimization";

const createSeed = (id: string): CandidateSeed => ({
  user: {
    id,
    displayName: `Candidate ${id}`,
    avatarColor: "#5f5bff",
  },
  portfolio: {
    tokens: Array.from({ length: 7 }).map((_, index) => ({
      symbol: `T${index + 1}`,
      allocation: 0.1,
    })),
    defiProtocols: Array.from({ length: 6 }).map((_, index) => ({
      name: `Protocol ${index + 1}`,
      category: "lending",
      risk: "balanced",
    })),
    nftCollections: Array.from({ length: 4 }).map((_, index) => ({
      name: `Collection ${index + 1}`,
      theme: "art",
      vibe: "luxury",
    })),
    activity: {
      timezoneOffset: 0,
      activeHours: [8, 9, 10, 11, 19, 20, 21, 22],
      tradingFrequency: "daily",
      riskTolerance: "balanced",
    },
    highlights: ["Highlight A", "Highlight B", "Highlight C"],
    transactions: [],
  },
});

describe("optimizeCandidateSeeds", () => {
  const seeds = [createSeed("1"), createSeed("2"), createSeed("3")];

  it("respects the limit while preserving order", () => {
    const optimized = optimizeCandidateSeeds(seeds, { limit: 2, intent: "balanced" });
    expect(optimized).toHaveLength(2);
    expect(optimized[0].user.id).toBe("1");
    expect(optimized[1].user.id).toBe("2");
    expect(optimized[0].portfolio.tokens).toHaveLength(7);
  });

  it("trims portfolio detail for data saver intent", () => {
    const optimized = optimizeCandidateSeeds(seeds, { limit: 3, intent: "data-saver" });
    expect(optimized[0].portfolio.tokens).toHaveLength(4);
    expect(optimized[0].portfolio.defiProtocols).toHaveLength(3);
    expect(optimized[0].portfolio.nftCollections).toHaveLength(2);
    expect(optimized[0].portfolio.activity.activeHours.length).toBeLessThanOrEqual(4);
  });

  it("reduces but preserves meaningful data for slow networks", () => {
    const optimized = optimizeCandidateSeeds(seeds, { intent: "slow-network" });
    expect(optimized[0].portfolio.tokens.length).toBeLessThanOrEqual(5);
    expect(optimized[0].portfolio.defiProtocols.length).toBeLessThanOrEqual(4);
    expect(optimized[0].portfolio.nftCollections.length).toBeLessThanOrEqual(3);
  });
});

describe("resolveOptimizationIntent", () => {
  it("prefers data saver when save-data is enabled", () => {
    expect(resolveOptimizationIntent({ saveData: true, effectiveType: "4g" })).toBe("data-saver");
  });

  it("detects slow network conditions", () => {
    expect(resolveOptimizationIntent({ effectiveType: "2g" })).toBe("slow-network");
    expect(resolveOptimizationIntent({ effectiveType: "slow-2g" })).toBe("slow-network");
  });

  it("falls back to balanced otherwise", () => {
    expect(resolveOptimizationIntent({ saveData: false, effectiveType: "4g" })).toBe("balanced");
    expect(resolveOptimizationIntent({})).toBe("balanced");
  });
});
