import { beforeEach, describe, expect, it } from "vitest";

import {
  planBasePayGift,
  planPortfolioSnippet,
  planReaction,
  planPhotoShare,
  planVoiceNote,
} from "../advancedMessages";
import { extractReactions } from "../reactions";
import { toDeliveredMessage } from "../autoresponder";
import { appendMessage, listMessages, resetChatState } from "../state";
import type { ChatParticipant } from "../types";
import type { PortfolioSnapshot } from "../../portfolio/types";

const participant: ChatParticipant = {
  userId: "user-1",
  displayName: "Ava",
  avatarColor: "linear-gradient(135deg, #5f5bff, #00d1ff)",
};

const sampleSnapshot: PortfolioSnapshot = {
  tokens: [
    { symbol: "ETH", allocation: 0.35, conviction: "high" },
    { symbol: "DEGEN", allocation: 0.2 },
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
    activeHours: [8, 9, 20, 21],
    tradingFrequency: "weekly",
    riskTolerance: "balanced",
  },
  highlights: ["Runs DAO operations", "Base day-one"],
};

describe("advanced chat message planning", () => {
  it("creates Base Pay gift metadata with fiat estimate", () => {
    const plan = planBasePayGift({ asset: "USDC", amount: 12.5, note: "gm" });
    expect(plan.summary).toContain("12.50 USDC");
    expect(plan.metadata.provider).toBe("base_pay");
    expect(plan.metadata.status).toBe("processing");
    expect(plan.metadata.reference).toMatch(/[0-9a-f-]{8,}/i);
    expect(plan.metadata.fiatEstimateUsd).toBeCloseTo(12.5);
  });

  it("respects privacy preferences when sharing a portfolio snippet", () => {
    const plan = planPortfolioSnippet({
      snapshot: sampleSnapshot,
      preferences: {
        shareTokens: false,
        shareDefi: true,
        shareNfts: false,
        shareActivity: false,
        shareHighlights: false,
        tokenVisibility: "SUMMARY",
        defiVisibility: "SUMMARY",
        nftVisibility: "SUMMARY",
        activityVisibility: "TIMEZONE_ONLY",
      },
    });

    expect(plan.summary).toContain("privacy-safe");
    expect(plan.metadata.snapshot.tokens).toHaveLength(0);
    expect(plan.metadata.snapshot.defiProtocols).toHaveLength(2);
    expect(plan.metadata.snapshot.nftCollections).toHaveLength(0);
    expect(plan.metadata.snapshot.activity).toBeNull();
    expect(plan.metadata.preferences.shareTokens).toBe(false);
  });

  it("produces voice note previews with waveform data", () => {
    const plan = planVoiceNote({ durationSeconds: 22, vibe: "excited", transcription: "gm fam" });
    expect(plan.metadata.durationSeconds).toBeGreaterThan(0);
    expect(plan.metadata.waveform.length).toBeGreaterThan(0);
    expect(plan.metadata.transcription).toBe("gm fam");
    expect(plan.summary).toContain("voice note");
  });

  it("summarizes shared photos with captions", () => {
    const plan = planPhotoShare({
      fileName: "date-night.png",
      size: 245678,
      previewUrl: "data:image/png;base64,hello",
      caption: "Base mainnet vibes",
      width: 800,
      height: 600,
    });
    expect(plan.metadata.type).toBe("photo");
    expect(plan.metadata.caption).toBe("Base mainnet vibes");
    expect(plan.summary).toContain("Shared a photo");
  });
});

describe("advanced chat state integration", () => {
  const conversationId = "conversation-advanced";

  beforeEach(() => {
    resetChatState();
  });

  it("stores advanced metadata and groups reactions", () => {
    const giftPlan = planBasePayGift({ asset: "USDC", amount: 5, note: "Onchain latte" });
    const giftMessage = toDeliveredMessage(conversationId, participant, giftPlan.summary, Date.now(), {
      kind: "gift",
      metadata: giftPlan.metadata,
    });
    appendMessage(conversationId, giftMessage);

    const reactionPlan = planReaction({ emoji: "🔥", targetMessageId: giftMessage.id });
    const reactionMessage = toDeliveredMessage(conversationId, participant, reactionPlan.summary, Date.now(), {
      kind: "reaction",
      metadata: reactionPlan.metadata,
    });
    appendMessage(conversationId, reactionMessage);

    const history = listMessages(conversationId);
    expect(history).toHaveLength(2);
    expect(history[0]?.kind).toBe("gift");
    expect(history[0]?.metadata?.type).toBe("gift");

    const grouped = extractReactions(history);
    expect(grouped.nonReactionMessages).toHaveLength(1);
    const reactionEntries = grouped.reactions.get(giftMessage.id);
    expect(reactionEntries).toBeDefined();
    expect(reactionEntries?.[0]?.emoji).toBe("🔥");
    expect(reactionEntries?.[0]?.count).toBe(1);
  });
});
