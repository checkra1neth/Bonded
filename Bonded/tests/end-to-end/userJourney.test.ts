import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildMatchCandidate, type CompatibilityProfile } from "../../lib/matching/compatibility";
import { createMatchQueueState, matchQueueReducer } from "../../lib/matching/queue";
import { planPortfolioSnippet } from "../../lib/chat/advancedMessages";
import { encryptChatMessage, decryptChatMessage, scrubMessageForTransmission } from "../../lib/chat/encryption";
import { createAutoResponse, toDeliveredMessage } from "../../lib/chat/autoresponder";
import { DEFAULT_PRIVACY_PREFERENCES } from "../../lib/portfolio/privacy";
import { resetKeyVaultForTesting } from "../../lib/security/keyVault";

const seekerProfile: CompatibilityProfile = {
  user: {
    id: "seeker-1",
    displayName: "Ava Protocol",
    personality: "DeFi Degen",
    avatarColor: "linear-gradient(135deg,#5f5bff,#00d1ff)",
  },
  portfolio: {
    tokens: [
      { symbol: "ETH", allocation: 0.34, conviction: "high" },
      { symbol: "DEGEN", allocation: 0.21, conviction: "medium" },
      { symbol: "AERO", allocation: 0.15 },
      { symbol: "USDC", allocation: 0.12 },
      { symbol: "CBETH", allocation: 0.1 },
      { symbol: "UNI", allocation: 0.08 },
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
  },
};

const candidateProfile: CompatibilityProfile = {
  user: {
    id: "candidate-1",
    displayName: "Nova Yield",
    personality: "Diamond Hands",
    avatarColor: "linear-gradient(135deg,#ff8a8a,#ffd76f)",
  },
  portfolio: {
    tokens: [
      { symbol: "ETH", allocation: 0.33, conviction: "high" },
      { symbol: "DEGEN", allocation: 0.2, conviction: "medium" },
      { symbol: "AERO", allocation: 0.14 },
      { symbol: "USDC", allocation: 0.1 },
      { symbol: "CBETH", allocation: 0.08 },
      { symbol: "BAL", allocation: 0.07 },
      { symbol: "OP", allocation: 0.08 },
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
      activeHours: [9, 10, 11, 19, 20, 21],
      tradingFrequency: "daily",
      riskTolerance: "balanced",
    },
    highlights: ["Leading a treasury diversification squad"],
  },
};

let uuidCounter = 0;

beforeEach(() => {
  uuidCounter = 0;
  vi.restoreAllMocks();
  resetKeyVaultForTesting();
  vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(() => {
    uuidCounter += 1;
    return `uuid-${uuidCounter}`;
  });
  vi.spyOn(Math, "random").mockImplementation(() => 0.42);
});

describe("end-to-end compatibility journey", () => {
  it("connects matching, secure messaging, and auto responses", async () => {
    const candidate = buildMatchCandidate(seekerProfile, candidateProfile, {
      interaction: { initialDecision: "like" },
    });

    const queue = createMatchQueueState([candidate]);
    const decided = matchQueueReducer(queue, {
      type: "DECIDE",
      candidateId: candidate.user.id,
      decision: "like",
      timestamp: 1_697_000_000_000,
    });

    expect(decided.matches).toHaveLength(1);
    const match = decided.matches[0];

    const privacyPreferences = {
      ...DEFAULT_PRIVACY_PREFERENCES,
      shareNfts: false,
      tokenVisibility: "SUMMARY" as const,
      defiVisibility: "SUMMARY" as const,
      activityVisibility: "PATTERNS" as const,
    };

    const snippetPlan = planPortfolioSnippet({
      snapshot: seekerProfile.portfolio,
      preferences: privacyPreferences,
    });

    expect(snippetPlan.metadata.snapshot.tokens.every((token) => !("value" in token))).toBe(true);
    expect(snippetPlan.summary).toContain("portfolio snapshot");

    const { payload, preview } = await encryptChatMessage(match.id, snippetPlan.summary, {
      associatedData: { senderId: seekerProfile.user.id },
    });

    const delivered = toDeliveredMessage(
      match.id,
      { userId: seekerProfile.user.id, displayName: seekerProfile.user.displayName },
      snippetPlan.summary,
      1_697_000_000_500,
      { kind: "portfolio_snippet", metadata: snippetPlan.metadata, encryption: payload, preview },
    );

    const asPeer = scrubMessageForTransmission(delivered, { includePlaintext: false });
    expect(asPeer.body).toBe(preview);

    const decrypted = await decryptChatMessage(payload, match.id, {
      associatedData: { senderId: seekerProfile.user.id },
    });
    expect(decrypted).toBe(snippetPlan.summary);

    const autoResponse = createAutoResponse(
      { userId: candidate.user.id, displayName: candidate.user.displayName },
      [delivered],
    );

    expect(autoResponse.body).toContain(candidate.user.displayName);
    expect(autoResponse.typingDuration).toBeGreaterThan(0);
    expect(autoResponse.sendDelay).toBeGreaterThan(autoResponse.typingDuration);
  });
});
