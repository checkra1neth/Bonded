import { describe, expect, it } from "vitest";

import { createPortabilityArchive, planDataDeletion } from "../compliance";
import type { PortfolioPrivacyPreferences } from "../../portfolio/privacy";
import type { SanitizedPortfolioSnapshot } from "../../portfolio/types";
import type { ChatMessage } from "../../chat/types";

const preferences: PortfolioPrivacyPreferences = {
  shareTokens: true,
  shareDefi: false,
  shareNfts: false,
  shareActivity: true,
  shareHighlights: true,
  shareTransactions: true,
  tokenVisibility: "SUMMARY",
  defiVisibility: "HIDDEN",
  nftVisibility: "HIDDEN",
  activityVisibility: "PATTERNS",
  transactionVisibility: "ANONYMIZED",
  transactionWindowDays: 30,
  maskTokenConviction: true,
  maskTokenChains: true,
  maskDefiStrategies: true,
  maskDefiRisks: true,
  maskNftThemes: true,
  maskActivityRisk: true,
  redactHighlights: false,
  allowList: { fids: [], walletAddresses: [] },
};

const portfolio: SanitizedPortfolioSnapshot = {
  tokens: [],
  defiProtocols: [],
  nftCollections: [],
  activity: null,
  highlights: [],
  transactions: null,
};

describe("privacy compliance utilities", () => {
  it("creates portability archives with checksums", () => {
    const conversations: Array<{ conversationId: string; messages: ChatMessage[] }> = [
      {
        conversationId: "conv-1",
        messages: [
          {
            id: "msg-1",
            conversationId: "conv-1",
            senderId: "user-1",
            senderName: "Ava",
            body: "gm",
            kind: "text",
            status: "delivered",
            createdAt: 1,
            deliveredAt: 1,
          },
        ],
      },
    ];

    const archive = createPortabilityArchive({
      userId: "user-1",
      preferences,
      portfolio,
      conversations,
      generatedAt: new Date("2024-03-01T12:00:00Z"),
    });

    expect(archive.userId).toBe("user-1");
    expect(archive.conversations[0]?.messageCount).toBe(1);
    expect(archive.checksum).toMatch(/^[0-9a-f]{8}$/i);
  });

  it("produces deletion plans with normalized timestamps", () => {
    const plan = planDataDeletion({
      userId: "user-2",
      conversations: ["conv-1", "conv-1", "conv-2"],
      includePortfolio: true,
      requestedAt: new Date("2024-03-02T09:30:00Z"),
    });

    expect(plan.userId).toBe("user-2");
    expect(plan.purgeConversations).toEqual(["conv-1", "conv-2"]);
    expect(plan.redactPortfolio).toBe(true);
    expect(plan.revokeKeys).toBe(true);
    expect(plan.notifyMatches).toBe(true);
    expect(plan.requestedAt).toBe("2024-03-02T09:30:00.000Z");
  });
});
