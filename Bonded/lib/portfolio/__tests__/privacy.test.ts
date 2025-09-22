import { describe, expect, it } from "vitest";

import type { PortfolioSnapshot } from "../types";
import {
  DEFAULT_PRIVACY_PREFERENCES,
  applyPrivacyPreferences,
  canViewerAccessPortfolio,
  normalizePrivacyPreferences,
} from "../privacy";

const baseSnapshot: PortfolioSnapshot = {
  tokens: [
    { symbol: "ETH", allocation: 0.42, conviction: "high" },
    { symbol: "AERO", allocation: 0.21 },
    { symbol: "USDC", allocation: 0.18 },
    { symbol: "DEGEN", allocation: 0.11 },
    { symbol: "MAGIC", allocation: 0.08 },
  ],
  defiProtocols: [
    { name: "Aave", category: "lending", risk: "balanced" },
    { name: "Aerodrome", category: "dex", risk: "adventurous" },
    { name: "EigenLayer", category: "staking", risk: "balanced" },
    { name: "Balancer", category: "dex", risk: "adventurous" },
  ],
  nftCollections: [
    { name: "BasePaint", theme: "art", vibe: "cypherpunk" },
    { name: "Parallel", theme: "gaming", vibe: "luxury" },
    { name: "Chromie Squiggle", theme: "art", vibe: "artsy" },
  ],
  activity: {
    timezoneOffset: 2,
    activeHours: [7, 8, 9, 18, 19, 23],
    tradingFrequency: "weekly",
    riskTolerance: "balanced",
  },
  highlights: ["Anchor in ETH, loves Base ecosystem"],
};

describe("applyPrivacyPreferences", () => {
  it("removes portfolio sections when sharing is disabled", () => {
    const sanitized = applyPrivacyPreferences(baseSnapshot, {
      ...DEFAULT_PRIVACY_PREFERENCES,
      shareTokens: false,
      shareDefi: false,
      shareNfts: false,
      shareActivity: false,
      shareHighlights: false,
    });

    expect(sanitized.tokens).toHaveLength(0);
    expect(sanitized.defiProtocols).toHaveLength(0);
    expect(sanitized.nftCollections).toHaveLength(0);
    expect(sanitized.activity).toBeNull();
    expect(sanitized.highlights).toHaveLength(0);
  });

  it("returns bucketed token allocations without exposing exact amounts", () => {
    const sanitized = applyPrivacyPreferences(baseSnapshot, {
      ...DEFAULT_PRIVACY_PREFERENCES,
      tokenVisibility: "SUMMARY",
    });

    expect(sanitized.tokens.length).toBeLessThanOrEqual(3);
    sanitized.tokens.forEach((token) => {
      expect(token).not.toHaveProperty("allocation");
      expect(token.allocationBucket).toMatch(/dominant|significant|diversified|exploratory/);
    });
  });

  it("summarizes activity patterns into human friendly ranges", () => {
    const sanitized = applyPrivacyPreferences(baseSnapshot, {
      ...DEFAULT_PRIVACY_PREFERENCES,
      activityVisibility: "PATTERNS",
    });

    expect(sanitized.activity).not.toBeNull();
    expect(sanitized.activity?.timezone).toBe("UTC+02");
    expect(sanitized.activity?.activePeriods).toEqual([
      "early_morning",
      "morning",
      "evening",
      "late_night",
    ]);
  });
});

describe("canViewerAccessPortfolio", () => {
  it("enforces allow lists when configured", () => {
    const preferences = normalizePrivacyPreferences({
      allowList: { fids: [1234], walletAddresses: ["0xabcDEF"] },
    });

    expect(canViewerAccessPortfolio(preferences, { fid: 1234 })).toBe(true);
    expect(canViewerAccessPortfolio(preferences, { walletAddress: "0xabcdef" })).toBe(true);
    expect(canViewerAccessPortfolio(preferences, { fid: 4321 })).toBe(false);
    expect(canViewerAccessPortfolio(preferences, {})).toBe(false);
  });

  it("defaults to accessible when no allow list restrictions are present", () => {
    const preferences = normalizePrivacyPreferences({});

    expect(canViewerAccessPortfolio(preferences, {})).toBe(true);
    expect(canViewerAccessPortfolio(preferences, { fid: 42 })).toBe(true);
  });

  it("always allows the owner to view their own data", () => {
    const preferences = normalizePrivacyPreferences({
      allowList: { fids: [1] },
    });

    expect(canViewerAccessPortfolio(preferences, { isOwner: true })).toBe(true);
  });
});
