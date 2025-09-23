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
  transactions: [
    {
      id: "tx-1",
      hash: "0xabc",
      timestamp: new Date("2024-03-02T12:00:00Z").getTime(),
      direction: "inbound",
      counterparty: "0x5c7ba1dc8736e3617476e0cdbb480d0d0f2e0c79",
      counterpartyType: "protocol",
      protocol: "Aerodrome",
      asset: "USDC",
      valueUsd: 120,
      note: "erc20",
    },
    {
      id: "tx-2",
      hash: "0xdef",
      timestamp: new Date("2024-03-01T19:00:00Z").getTime(),
      direction: "outbound",
      counterparty: "0x1234567890abcdef1234567890abcdef12345678",
      counterpartyType: "user",
      asset: "ETH",
      valueUsd: 420,
      note: "erc20",
    },
    {
      id: "tx-3",
      hash: "0xghi",
      timestamp: new Date("2023-12-15T10:00:00Z").getTime(),
      direction: "self",
      counterparty: "0xself",
      counterpartyType: "user",
      asset: "DEGEN",
      valueUsd: 50,
      note: "erc20",
    },
  ],
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
    expect(sanitized.transactions).toBeNull();
  });

  it("returns bucketed token allocations without exposing exact amounts", () => {
    const sanitized = applyPrivacyPreferences(baseSnapshot, {
      ...DEFAULT_PRIVACY_PREFERENCES,
      tokenVisibility: "SUMMARY",
    });

    expect(sanitized.tokens.length).toBeLessThanOrEqual(3);
    sanitized.tokens.forEach((token) => {
      expect(token).not.toHaveProperty("allocation");
      expect(token).not.toHaveProperty("conviction");
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
    expect(sanitized.activity?.riskTolerance).toBe("withheld");
  });

  it("applies advanced redaction toggles", () => {
    const sanitized = applyPrivacyPreferences(baseSnapshot, {
      ...DEFAULT_PRIVACY_PREFERENCES,
      maskTokenChains: true,
      maskDefiStrategies: true,
      maskDefiRisks: true,
      maskNftThemes: true,
      maskActivityRisk: true,
      redactHighlights: true,
      shareTransactions: true,
      transactionVisibility: "ANONYMIZED",
      transactionWindowDays: 400,
    });

    expect(sanitized.tokens[0]).not.toHaveProperty("chain");
    expect(sanitized.defiProtocols[0]).not.toHaveProperty("strategy");
    expect(sanitized.defiProtocols[0]).not.toHaveProperty("risk");
    expect(sanitized.nftCollections[0]?.name).toBe("Private collection");
    expect(sanitized.activity?.riskTolerance).toBe("withheld");
    expect(sanitized.highlights[0]).toMatch(/milestone/i);
    expect(sanitized.transactions).not.toBeNull();
    expect(sanitized.transactions?.notableCounterparties[0]).toMatch(/Counterparty|Bridge|Aerodrome/i);
  });

  it("anonymizes transaction history into rolling buckets", () => {
    const sanitized = applyPrivacyPreferences(baseSnapshot, {
      ...DEFAULT_PRIVACY_PREFERENCES,
      shareTokens: false,
      shareDefi: false,
      shareNfts: false,
      shareActivity: false,
      shareHighlights: false,
      shareTransactions: true,
      transactionVisibility: "SUMMARY",
      transactionWindowDays: 400,
    });

    expect(sanitized.transactions).not.toBeNull();
    expect(sanitized.transactions?.visibility).toBe("SUMMARY");
    expect(sanitized.transactions?.buckets.length).toBeGreaterThan(0);
    const lifetimeBucket = sanitized.transactions?.buckets.find((bucket) => bucket.period === "lifetime");
    expect(lifetimeBucket?.inboundCount).toBeGreaterThan(0);
    expect(lifetimeBucket?.volumeBucket).toMatch(/minimal|moderate|active|high/);
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
