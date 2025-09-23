import { describe, expect, it } from "vitest";

import { assessPersonality } from "../assessment";
import type { PortfolioSnapshot } from "../../portfolio/types";

const baseActivity = {
  timezoneOffset: -5,
  activeHours: [9, 10, 11, 20, 21],
  tradingFrequency: "weekly" as const,
  riskTolerance: "balanced" as const,
};

describe("assessPersonality", () => {
  it("classifies capital preservation portfolios as Banker", () => {
    const snapshot: PortfolioSnapshot = {
      tokens: [
        { symbol: "USDC", allocation: 0.4 },
        { symbol: "ETH", allocation: 0.35, conviction: "high" },
        { symbol: "CBETH", allocation: 0.25 },
      ],
      defiProtocols: [
        { name: "Aave", category: "lending", risk: "balanced" },
        { name: "EigenLayer", category: "staking", risk: "balanced" },
      ],
      nftCollections: [],
      activity: { ...baseActivity, tradingFrequency: "monthly", riskTolerance: "balanced" },
      highlights: [],
    };

    const assessment = assessPersonality(snapshot);

    expect(assessment.type).toBe("Banker");
    expect(assessment.headline).toBeDefined();
    expect(assessment.scores[0].type).toBe("Banker");
    expect(assessment.confidence).toBeGreaterThan(0.35);
    expect(assessment.strengths.length).toBeGreaterThan(0);
  });

  it("identifies high velocity DeFi behaviour as DeFi Degen", () => {
    const snapshot: PortfolioSnapshot = {
      tokens: [
        { symbol: "DEGEN", allocation: 0.35, conviction: "high" },
        { symbol: "PEPE", allocation: 0.25 },
        { symbol: "ETH", allocation: 0.2 },
        { symbol: "USDC", allocation: 0.2 },
      ],
      defiProtocols: [
        { name: "Aerodrome", category: "dex", risk: "adventurous" },
        { name: "BaseSwap", category: "dex", risk: "adventurous" },
        { name: "GMX", category: "perps", risk: "degenerate" },
      ],
      nftCollections: [],
      activity: {
        timezoneOffset: 0,
        activeHours: [0, 1, 2, 3, 21, 22, 23],
        tradingFrequency: "daily",
        riskTolerance: "degenerate",
      },
      highlights: [],
    };

    const assessment = assessPersonality(snapshot);

    expect(assessment.type).toBe("DeFi Degen");
    expect(assessment.scores).toHaveLength(6);
    expect(assessment.scores[0].score).toBeGreaterThan(assessment.scores[1].score);
    expect(assessment.summary).toContain("Risk-on operator");
  });

  it("captures cultural focus portfolios as NFT Collector", () => {
    const snapshot: PortfolioSnapshot = {
      tokens: [
        { symbol: "ETH", allocation: 0.45, conviction: "high" },
        { symbol: "AERO", allocation: 0.2 },
        { symbol: "USDC", allocation: 0.15 },
        { symbol: "MAGIC", allocation: 0.2 },
      ],
      defiProtocols: [
        { name: "Zora", category: "infrastructure", risk: "balanced" },
      ],
      nftCollections: [
        { name: "BasePaint", theme: "art", vibe: "cypherpunk" },
        { name: "Parallel", theme: "gaming", vibe: "luxury" },
        { name: "Chromie Squiggle", theme: "art", vibe: "artsy" },
      ],
      activity: { ...baseActivity, tradingFrequency: "monthly" },
      highlights: [],
    };

    const assessment = assessPersonality(snapshot);

    expect(assessment.type).toBe("NFT Collector");
    expect(assessment.strengths.some((item) => item.includes("NFT"))).toBe(true);
    expect(assessment.growthAreas.length).toBeGreaterThan(0);
    expect(new Set(assessment.scores.map((score) => score.type)).size).toBe(6);
  });
});
