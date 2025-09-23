import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import { createCompatibilityReport } from "../compatibilityReport";
import { buildMatchCandidate, type CompatibilityProfile } from "../../matching/compatibility";
import { createCompatibilityAnalysisRecord } from "../../portfolio/analysis";
import type { PortfolioSnapshot } from "../../portfolio/types";

const seekerPortfolio: PortfolioSnapshot = {
  tokens: [
    { symbol: "ETH", allocation: 0.32, conviction: "high" },
    { symbol: "DEGEN", allocation: 0.22, conviction: "medium" },
    { symbol: "AERO", allocation: 0.16 },
    { symbol: "USDC", allocation: 0.1 },
    { symbol: "CBETH", allocation: 0.08 },
    { symbol: "UNI", allocation: 0.07 },
    { symbol: "AEROX", allocation: 0.05 },
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
    activeHours: [8, 9, 10, 11, 19, 20, 21, 22],
    tradingFrequency: "daily",
    riskTolerance: "adventurous",
  },
  highlights: ["On-chain since 2018", "Runs a weekly governance call"],
};

const seekerProfile: CompatibilityProfile = {
  user: {
    id: "seeker",
    displayName: "Ava Protocol",
    personality: "DeFi Degen",
  },
  portfolio: seekerPortfolio,
};

const candidatePortfolio: PortfolioSnapshot = {
  tokens: [
    { symbol: "ETH", allocation: 0.3, conviction: "high" },
    { symbol: "DEGEN", allocation: 0.2, conviction: "medium" },
    { symbol: "AERO", allocation: 0.16 },
    { symbol: "CBETH", allocation: 0.12 },
    { symbol: "USDC", allocation: 0.12 },
    { symbol: "BAL", allocation: 0.1 },
  ],
  defiProtocols: [
    { name: "Aave", category: "lending", risk: "balanced" },
    { name: "Aerodrome", category: "dex", risk: "adventurous" },
    { name: "EigenLayer", category: "staking", risk: "balanced" },
  ],
  nftCollections: [
    { name: "BasePaint", theme: "art", vibe: "cypherpunk" },
    { name: "Opepens", theme: "art", vibe: "playful" },
  ],
  activity: {
    timezoneOffset: 0,
    activeHours: [9, 10, 11, 12, 19, 20, 21],
    tradingFrequency: "daily",
    riskTolerance: "balanced",
  },
  highlights: ["Treasury design partner", "Hosts weekly Base call"],
};

const candidateProfile: CompatibilityProfile = {
  user: {
    id: "nova-yield",
    displayName: "Nova Yield",
    personality: "Banker",
  },
  portfolio: candidatePortfolio,
};

describe("createCompatibilityReport", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2024-10-05T12:00:00Z"));
    vi.spyOn(Math, "random").mockReturnValue(0.123456789);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("creates a shareable compatibility report with sanitized highlights", () => {
    const candidate = buildMatchCandidate(seekerProfile, candidateProfile);
    const record = createCompatibilityAnalysisRecord({
      ownerId: seekerProfile.user.id,
      portfolioId: "portfolio-1",
      snapshot: candidateProfile.portfolio,
      score: candidate.compatibilityScore,
      sharedInterests: candidate.sharedInterests,
      targetUserId: candidateProfile.user.id,
    });

    const report = createCompatibilityReport(record, {
      ownerAlias: seekerProfile.user.displayName,
      partnerAlias: candidateProfile.user.displayName,
      theme: "sunrise",
    });

    expect(report.id).toBe(`report_${record.id}`);
    expect(report.summary).toContain("Ava Protocol");
    expect(report.summary).toContain("Nova Yield");
    expect(report.highlights.length).toBeGreaterThan(0);
    expect(report.highlights.every((highlight) => !highlight.includes("%"))).toBe(true);
    expect(report.insights.length).toBeGreaterThan(0);
    expect(report.heroStat).toMatch(/% sync$/);
    expect(report.infographic.theme).toBe("sunrise");
    expect(report.infographic.metrics).toHaveLength(4);
    expect(report.infographic.metrics[0]).toMatchObject({ label: "Token Alignment" });
    expect(report.privacy.summary).toMatch(/No exact balances/i);
    expect(report.sharePlans).toHaveLength(3);
    expect(report.sharePlans.map((plan) => plan.platform)).toEqual([
      "warpcast",
      "lens",
      "x",
    ]);

    const xPlan = report.sharePlans.find((plan) => plan.platform === "x");
    expect(xPlan).toBeDefined();
    expect(xPlan?.copy.length ?? 0).toBeLessThanOrEqual(280);
    expect(xPlan?.referralUrl).toContain(`ref=${report.referral.code}`);
    expect(xPlan?.hashtags).toContain("Bonded");
    expect(report.shareCopy).toBe(report.sharePlans[0]?.copy);
    expect(report.referral.shareUrl).toContain("utm_campaign=compatibility_report");
  });

  it("supports custom platform selection and privacy-only shares", () => {
    const candidate = buildMatchCandidate(seekerProfile, candidateProfile);
    const record = createCompatibilityAnalysisRecord({
      ownerId: seekerProfile.user.id,
      portfolioId: "portfolio-1",
      snapshot: candidateProfile.portfolio,
      score: candidate.compatibilityScore,
      sharedInterests: candidate.sharedInterests,
      targetUserId: candidateProfile.user.id,
      privacy: {
        shareTokens: false,
        shareDefi: false,
        shareNfts: false,
        shareActivity: false,
        shareHighlights: false,
      },
    });

    const report = createCompatibilityReport(record, {
      ownerAlias: "Ava",
      partnerAlias: "Nova",
      platforms: ["x"],
      theme: "midnight",
      shareBaseUrl: "https://bonded.fun/share",
    });

    expect(report.sharePlans).toHaveLength(1);
    expect(report.sharePlans[0].platform).toBe("x");
    expect(report.sharePlans[0].referralUrl).toContain("utm_source=x");
    expect(report.sharePlans[0].referralUrl).toContain("https://bonded.fun/share");
    expect(report.highlights[0]).toMatch(/privacy/i);
    expect(report.privacy.tokensShared).toBe(false);
    expect(report.privacy.summary).toMatch(/No portfolio sections shared/i);
    expect(report.infographic.theme).toBe("midnight");
  });
});
