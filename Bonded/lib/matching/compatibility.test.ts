import { describe, expect, it } from "vitest";
import {
  buildMatchCandidate,
  calculateCompatibility,
  type CompatibilityProfile,
  type PortfolioSnapshot,
  type UserProfile,
} from "./compatibility";

const basePortfolio: PortfolioSnapshot = {
  tokens: [
    { symbol: "ETH", allocation: 0.35, conviction: "high" },
    { symbol: "DEGEN", allocation: 0.2, conviction: "medium" },
    { symbol: "AERO", allocation: 0.15 },
    { symbol: "USDC", allocation: 0.1 },
    { symbol: "CBETH", allocation: 0.08 },
    { symbol: "UNI", allocation: 0.12 },
  ],
  defiProtocols: [
    { name: "Aave", category: "lending", risk: "balanced" },
    { name: "BaseSwap", category: "dex", risk: "adventurous" },
    { name: "Aerodrome", category: "dex", risk: "adventurous" },
    { name: "EigenLayer", category: "staking", risk: "balanced" },
  ],
  nftCollections: [
    { name: "BasePaint", theme: "art", vibe: "cypherpunk" },
    { name: "Parallel", theme: "gaming", vibe: "luxury" },
  ],
  activity: {
    timezoneOffset: -5,
    activeHours: [8, 9, 10, 11, 19, 20, 21, 22],
    tradingFrequency: "daily",
    riskTolerance: "adventurous",
  },
};

const createProfile = (
  overrides: {
    user?: Partial<UserProfile>;
    portfolio?: Partial<PortfolioSnapshot>;
  } = {},
): CompatibilityProfile => ({
  user: {
    id: "user-1",
    displayName: "Ava Protocol",
    personality: "DeFi Degen",
    ...overrides.user,
  },
  portfolio: {
    ...basePortfolio,
    ...overrides.portfolio,
  },
});

describe("calculateCompatibility", () => {
  it("returns perfect compatibility for identical profiles", () => {
    const seeker = createProfile();
    const candidate = createProfile({
      portfolio: {
        tokens: basePortfolio.tokens.map((token) => ({ ...token })),
      },
    });

    const result = calculateCompatibility(seeker, candidate);

    expect(result.overall).toBeCloseTo(1, 2);
    expect(result.category.id).toBe("crypto_soulmates");
    expect(result.reasoning.length).toBeGreaterThan(0);
    expect(result.factors).toHaveLength(4);
  });

  it("weights token similarity as the dominant factor", () => {
    const seeker = createProfile();
    const candidate = createProfile({
      portfolio: {
        tokens: [
          { symbol: "ETH", allocation: 0.3 },
          { symbol: "DEGEN", allocation: 0.25 },
          { symbol: "AERO", allocation: 0.15 },
          { symbol: "USDC", allocation: 0.1 },
          { symbol: "WBTC", allocation: 0.1 },
          { symbol: "BAL", allocation: 0.1 },
        ],
        defiProtocols: basePortfolio.defiProtocols,
        nftCollections: basePortfolio.nftCollections,
      },
    });

    const result = calculateCompatibility(seeker, candidate);

    expect(result.tokenSimilarity).toBeGreaterThan(0.6);
    expect(result.overall).toBeGreaterThan(0.75);
    expect(result.category.id).toBe("potential_match");
  });

  it("detects divergent strategies", () => {
    const seeker = createProfile();
    const candidate = createProfile({
      portfolio: {
        tokens: [
          { symbol: "MEME", allocation: 0.4, conviction: "exploratory" },
          { symbol: "DOGE", allocation: 0.3 },
          { symbol: "SHIB", allocation: 0.2 },
          { symbol: "PEPE", allocation: 0.1 },
        ],
        defiProtocols: [
          { name: "GMX", category: "perps", risk: "degenerate" },
        ],
        nftCollections: [
          { name: "Milady", theme: "pfp", vibe: "degen" },
        ],
        activity: {
          timezoneOffset: 8,
          activeHours: [1, 2, 3, 4, 5],
          tradingFrequency: "occasionally",
          riskTolerance: "degenerate",
        },
      },
    });

    const result = calculateCompatibility(seeker, candidate);

    expect(result.overall).toBeLessThan(0.5);
    expect(result.category.id).toBe("different_strategies");
    expect(result.reasoning.length).toBeGreaterThan(0);
  });
});

describe("buildMatchCandidate", () => {
  it("provides contextual icebreakers based on shared interests", () => {
    const seeker = createProfile();
    const candidate = createProfile({
      user: {
        id: "user-2",
        displayName: "Orbit",
        personality: "Diamond Hands",
      },
    });

    const match = buildMatchCandidate(seeker, candidate);

    expect(match.sharedInterests.some((interest) => interest.type === "token")).toBe(true);
    expect(match.icebreakers.length).toBeGreaterThan(0);
    expect(match.compatibilityScore.overall).toBeGreaterThan(0.9);
    expect(match.personality.type).toBe(match.user.personality);
    expect(match.personality.scores).toHaveLength(6);
    expect(match.interaction).toBeUndefined();
  });

  it("preserves interaction metadata when provided", () => {
    const seeker = createProfile();
    const candidate = createProfile({
      user: {
        id: "user-3",
        displayName: "Nova",
        personality: "DeFi Degen",
      },
    });

    const match = buildMatchCandidate(seeker, candidate, {
      interaction: {
        initialDecision: "like",
        autoResponse: { onSuperLike: "super" },
      },
    });

    expect(match.interaction?.initialDecision).toBe("like");
    expect(match.interaction?.autoResponse?.onSuperLike).toBe("super");
  });
});
