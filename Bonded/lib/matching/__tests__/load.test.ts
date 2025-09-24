import { describe, expect, it } from "vitest";
import { performance } from "node:perf_hooks";

import {
  buildMatchCandidate,
  type CompatibilityProfile,
  type PortfolioSnapshot,
} from "../compatibility";
import { filterCandidates } from "../../premium/filters";
import { prioritizeCandidates } from "../../premium/matching";
import { resolvePlan } from "../../premium/plans";

const basePortfolio: PortfolioSnapshot = {
  tokens: [
    { symbol: "ETH", allocation: 0.34, conviction: "high" },
    { symbol: "DEGEN", allocation: 0.22, conviction: "medium" },
    { symbol: "AERO", allocation: 0.14 },
    { symbol: "USDC", allocation: 0.1 },
    { symbol: "CBETH", allocation: 0.08 },
    { symbol: "UNI", allocation: 0.07 },
  ],
  defiProtocols: [
    { name: "Aave", category: "lending", risk: "balanced" },
    { name: "Aerodrome", category: "dex", risk: "adventurous" },
    { name: "EigenLayer", category: "staking", risk: "balanced" },
  ],
  nftCollections: [
    { name: "BasePaint", theme: "art", vibe: "cypherpunk" },
    { name: "Parallel", theme: "gaming", vibe: "luxury" },
  ],
  activity: {
    timezoneOffset: -5,
    activeHours: [8, 9, 10, 19, 20, 21],
    tradingFrequency: "daily",
    riskTolerance: "adventurous",
  },
  highlights: ["Runs a weekly governance call", "On-chain since 2018"],
};

function createProfile(id: string, offset: number): CompatibilityProfile {
  return {
    user: {
      id,
      displayName: `Candidate ${offset}`,
      personality: offset % 3 === 0 ? "DeFi Degen" : "Diamond Hands",
      avatarColor: `hsl(${(offset * 47) % 360}deg 70% 60%)`,
    },
    portfolio: {
      ...basePortfolio,
      tokens: basePortfolio.tokens.map((token, index) => ({
        ...token,
        allocation: Math.max(0.02, token.allocation - index * 0.005 - offset * 0.0005),
      })),
      activity: {
        ...basePortfolio.activity,
        timezoneOffset: basePortfolio.activity.timezoneOffset + (offset % 4) - 2,
      },
    },
  };
}

describe("matching performance", () => {
  it("filters and prioritizes large candidate pools within budget", () => {
    const seeker: CompatibilityProfile = {
      user: {
        id: "seeker",
        displayName: "Ava Protocol",
        personality: "DeFi Degen",
      },
      portfolio: basePortfolio,
    };

    const candidates = Array.from({ length: 320 }, (_, index) =>
      buildMatchCandidate(seeker, createProfile(`candidate-${index}`, index), {
        interaction: {
          initialDecision: index % 4 === 0 ? "like" : undefined,
          autoResponse: index % 3 === 0 ? { onLike: "like", onSuperLike: "super" } : undefined,
        },
      }),
    );

    const start = performance.now();
    const filtered = filterCandidates(candidates, {
      minScore: 0.55,
      tokenSymbols: ["ETH", "DEGEN"],
      defiProtocols: ["aave", "aerodrome"],
      activityFocus: ["active_hours"],
      warmSignalsOnly: true,
    });
    const prioritized = prioritizeCandidates(filtered, resolvePlan("premium_founder"));
    const duration = performance.now() - start;

    expect(prioritized.length).toBeGreaterThan(0);
    if (prioritized.length > 1) {
      expect(prioritized[0].compatibilityScore.overall).toBeGreaterThanOrEqual(
        prioritized.at(-1)!.compatibilityScore.overall,
      );
    }
    expect(duration).toBeLessThan(180);
  });
});
