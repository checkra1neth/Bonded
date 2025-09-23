import { describe, expect, it } from "vitest";

import { buildMatchCandidate, type CompatibilityProfile, type PortfolioSnapshot } from "./compatibility";
import {
  createMatchQueueState,
  matchQueueReducer,
  type MatchQueueState,
} from "./queue";

const seekerPortfolio: PortfolioSnapshot = {
  tokens: [
    { symbol: "ETH", allocation: 0.4, conviction: "high" },
    { symbol: "DEGEN", allocation: 0.2 },
    { symbol: "AERO", allocation: 0.15 },
    { symbol: "USDC", allocation: 0.1 },
    { symbol: "CBETH", allocation: 0.1 },
    { symbol: "UNI", allocation: 0.05 },
  ],
  defiProtocols: [
    { name: "Aave", category: "lending", risk: "balanced" },
    { name: "BaseSwap", category: "dex", risk: "adventurous" },
    { name: "Aerodrome", category: "dex", risk: "adventurous" },
  ],
  nftCollections: [
    { name: "BasePaint", theme: "art", vibe: "cypherpunk" },
    { name: "Parallel", theme: "gaming", vibe: "luxury" },
  ],
  activity: {
    timezoneOffset: -5,
    activeHours: [8, 9, 10, 20, 21],
    tradingFrequency: "daily",
    riskTolerance: "adventurous",
  },
};

const seekerProfile: CompatibilityProfile = {
  user: {
    id: "seeker",
    displayName: "Seeker",
    personality: "DeFi Degen",
  },
  portfolio: seekerPortfolio,
};

const createCandidate = (
  id: string,
  overrides: Partial<CompatibilityProfile["user"]> & {
    portfolio?: Partial<PortfolioSnapshot>;
    interaction?: Parameters<typeof buildMatchCandidate>[2]["interaction"];
  } = {},
) => {
  const profile: CompatibilityProfile = {
    user: {
      id,
      displayName: overrides.displayName ?? id,
      personality: overrides.personality ?? "Test Archetype",
    },
    portfolio: {
      ...seekerPortfolio,
      ...overrides.portfolio,
    },
  };

  return buildMatchCandidate(seekerProfile, profile, {
    interaction: overrides.interaction,
  });
};

describe("matchQueueReducer", () => {
  it("tracks decisions, matches, and notifications through the queue", () => {
    const ally = createCandidate("ally", {
      displayName: "Ally Protocol",
      interaction: { initialDecision: "like" },
    });
    const skeptic = createCandidate("skeptic", {
      displayName: "Skeptic", 
      portfolio: {
        tokens: [
          { symbol: "ETH", allocation: 0.2 },
          { symbol: "WBTC", allocation: 0.2 },
          { symbol: "USDC", allocation: 0.6 },
        ],
      },
      interaction: { autoResponse: { onLike: "pass", onSuperLike: "pass" } },
    });
    const fan = createCandidate("fan", {
      displayName: "Super Fan",
      interaction: { autoResponse: { onSuperLike: "like" } },
    });

    let state: MatchQueueState = createMatchQueueState([ally, skeptic]);
    expect(state.activeIndex).toBe(0);
    expect(state.exhausted).toBe(false);

    state = matchQueueReducer(state, {
      type: "DECIDE",
      candidateId: ally.user.id,
      decision: "like",
      timestamp: 1,
    });

    expect(state.entries[0].decision?.mutual).toBe(true);
    expect(state.matches).toHaveLength(1);
    expect(state.notifications).toHaveLength(1);
    expect(state.activeIndex).toBe(1);
    expect(state.exhausted).toBe(false);

    const notificationId = state.notifications[0]?.id as string;
    state = matchQueueReducer(state, { type: "DISMISS_NOTIFICATION", notificationId });
    expect(state.notifications).toHaveLength(0);

    state = matchQueueReducer(state, {
      type: "DECIDE",
      candidateId: skeptic.user.id,
      decision: "pass",
      timestamp: 2,
    });

    expect(state.entries[1].decision?.decision).toBe("pass");
    expect(state.exhausted).toBe(true);
    expect(state.activeIndex).toBe(-1);
    expect(state.decisions).toHaveLength(2);

    state = matchQueueReducer(state, {
      type: "ENQUEUE",
      candidates: [fan],
      timestamp: 3,
    });

    expect(state.entries).toHaveLength(3);
    expect(state.activeIndex).toBe(2);
    expect(state.exhausted).toBe(false);

    state = matchQueueReducer(state, {
      type: "DECIDE",
      candidateId: fan.user.id,
      decision: "super",
      timestamp: 4,
    });

    expect(state.matches).toHaveLength(2);
    expect(state.entries[2].decision?.mutual).toBe(true);
    expect(state.notifications).toHaveLength(1);
  });

  it("resets the queue with new candidates", () => {
    const candidate = createCandidate("reset-test");
    let state = createMatchQueueState([candidate]);

    state = matchQueueReducer(state, {
      type: "DECIDE",
      candidateId: candidate.user.id,
      decision: "like",
      timestamp: 8,
    });

    expect(state.decisions).toHaveLength(1);
    expect(state.exhausted).toBe(true);

    state = matchQueueReducer(state, {
      type: "RESET",
      candidates: [candidate],
    });

    expect(state.decisions).toHaveLength(0);
    expect(state.matches).toHaveLength(0);
    expect(state.notifications).toHaveLength(0);
    expect(state.activeIndex).toBe(0);
    expect(state.exhausted).toBe(false);
  });
});
