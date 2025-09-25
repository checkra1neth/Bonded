import React from "react";
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatInterface } from "../ChatInterface";
import { buildMatchCandidate, type CompatibilityProfile } from "../../../lib/matching/compatibility";
import type { MutualMatch } from "@/lib/matching/queue";
import type { ChatMessageView } from "../../hooks/useChatSession";
import type { ChatParticipant } from "@/lib/chat/types";

const sendMessageMock = vi.fn();
const notifyTypingMock = vi.fn();
const useChatSessionMock = vi.fn();
const followUpNotesMock = {
  records: {} as Record<string, never>,
  save: vi.fn(),
  complete: vi.fn(),
  reopen: vi.fn(),
  remove: vi.fn(),
};

vi.mock("../../hooks/useChatSession", () => ({
  useChatSession: (...args: unknown[]) => useChatSessionMock(...args),
}));

vi.mock("../../hooks/useMobileExperience", () => ({
  useMobileExperience: () => ({
    push: { supported: false, permission: "default", subscribed: false, isPromptInFlight: false, requestPermission: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn() },
    serviceWorker: { registration: null, state: { supported: false, registered: false, ready: false, installing: false, updateAvailable: false }, activateUpdate: vi.fn() },
    isMobileViewport: false,
    isStandalone: false,
    online: true,
    miniKit: { available: false, ready: false, capabilities: [] },
    performance: { slowFrameCount: 0, lastUpdated: 0 },
  }),
}));

vi.mock("../../hooks/useFollowUpNotes", () => ({
  useFollowUpNotes: () => followUpNotesMock,
}));

vi.mock(
  "@/lib/chat/advancedMessages",
  async () => ({
    ...(await import("../../../lib/chat/advancedMessages")),
  }),
);

vi.mock(
  "@/lib/chat/reactions",
  async () => ({
    ...(await import("../../../lib/chat/reactions")),
  }),
);

vi.mock("@/lib/mobile/notifications", () => ({
  notifyChatMessage: vi.fn().mockResolvedValue(undefined),
}));

const basePortfolio: CompatibilityProfile["portfolio"] = {
  tokens: [
    { symbol: "ETH", allocation: 0.32, conviction: "high" },
    { symbol: "DEGEN", allocation: 0.22, conviction: "medium" },
    { symbol: "AERO", allocation: 0.16 },
    { symbol: "USDC", allocation: 0.12 },
    { symbol: "CBETH", allocation: 0.08 },
  ],
  defiProtocols: [
    { name: "Aave", category: "lending", risk: "balanced" },
    { name: "Aerodrome", category: "dex", risk: "adventurous" },
    { name: "EigenLayer", category: "staking", risk: "balanced" },
  ],
  nftCollections: [
    { name: "BasePaint", theme: "art", vibe: "cypherpunk" },
  ],
  activity: {
    timezoneOffset: -5,
    activeHours: [8, 9, 10, 19, 20, 21],
    tradingFrequency: "daily",
    riskTolerance: "adventurous",
  },
  highlights: ["On-chain since 2019"],
};

const seekerProfile: CompatibilityProfile = {
  user: {
    id: "seeker-user",
    displayName: "Ava Protocol",
    personality: "DeFi Degen",
    avatarColor: "linear-gradient(135deg,#5f5bff,#00d1ff)",
  },
  portfolio: basePortfolio,
};

const candidateProfile: CompatibilityProfile = {
  user: {
    id: "candidate-user",
    displayName: "Nova Yield",
    personality: "Diamond Hands",
    avatarColor: "linear-gradient(135deg,#ff8a8a,#ffd76f)",
  },
  portfolio: {
    ...basePortfolio,
    tokens: basePortfolio.tokens.map((token, index) => ({
      ...token,
      allocation: token.allocation - index * 0.01 > 0 ? token.allocation - index * 0.01 : token.allocation,
    })),
  },
};

const matchCandidate = buildMatchCandidate(seekerProfile, candidateProfile, {
  interaction: { initialDecision: "like", autoResponse: { onLike: "like" } },
});

const mutualMatch: MutualMatch = {
  id: "match-1",
  candidateId: matchCandidate.user.id,
  displayName: matchCandidate.user.displayName,
  decision: "like",
  response: "like",
  createdAt: 1_697_000_000_000,
  categoryId: matchCandidate.compatibilityScore.category.id,
  compatibilityScore: matchCandidate.compatibilityScore.overall,
};

const candidatesById = new Map([
  [matchCandidate.user.id, { candidate: matchCandidate, portfolio: candidateProfile.portfolio }],
]);

const seekerParticipant: ChatParticipant = {
  userId: seekerProfile.user.id,
  displayName: seekerProfile.user.displayName,
  avatarColor: seekerProfile.user.avatarColor,
  role: "seeker",
};

function renderComponent(state: {
  messages: ChatMessageView[];
  typingUsers?: Array<{ userId: string; displayName: string }>;
  status?: "connecting" | "connected" | "disconnected";
}) {
  useChatSessionMock.mockReturnValue({
    messages: state.messages,
    typingUsers: state.typingUsers ?? [],
    status: state.status ?? "connected",
    sendMessage: sendMessageMock,
    notifyTyping: notifyTypingMock,
  });

  return render(
    <ChatInterface
      matches={[mutualMatch]}
      seeker={seekerParticipant}
      seekerPortfolio={seekerProfile.portfolio}
      candidatesById={candidatesById}
    />,
  );
}

describe("ChatInterface", () => {
  beforeEach(() => {
    useChatSessionMock.mockReset();
    sendMessageMock.mockReset();
    notifyTypingMock.mockReset();
    followUpNotesMock.save.mockReset();
    followUpNotesMock.complete.mockReset();
    followUpNotesMock.reopen.mockReset();
    followUpNotesMock.remove.mockReset();
  });

  it("shows an empty state when no matches are available", () => {
    useChatSessionMock.mockReturnValue({
      messages: [],
      typingUsers: [],
      status: "disconnected",
      sendMessage: sendMessageMock,
      notifyTyping: notifyTypingMock,
    });

    render(
      <ChatInterface
        matches={[]}
        seeker={seekerParticipant}
        seekerPortfolio={seekerProfile.portfolio}
        candidatesById={new Map()}
      />,
    );

    expect(screen.getByText("Unlock a mutual match to start a conversation with shared alpha.")).toBeInTheDocument();
  });

  it("supports advanced reactions and Base Pay gifting for an active conversation", async () => {
    const remoteMessage: ChatMessageView = {
      id: "message-1",
      conversationId: mutualMatch.id,
      senderId: matchCandidate.user.id,
      senderName: matchCandidate.user.displayName,
      senderAvatarColor: matchCandidate.user.avatarColor,
      body: "Ready to co-host a Base governance jam?",
      kind: "text",
      status: "delivered",
      createdAt: mutualMatch.createdAt,
      deliveredAt: mutualMatch.createdAt,
      isLocal: false,
    };

    renderComponent({
      messages: [remoteMessage],
      typingUsers: [{ userId: matchCandidate.user.id, displayName: matchCandidate.user.displayName }],
      status: "connected",
    });

    expect(screen.getByText(remoteMessage.body)).toBeInTheDocument();
    expect(screen.getByText(/is typing…/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "React" }));
    const reactionList = screen.getByRole("listbox");
    fireEvent.click(within(reactionList).getByRole("option", { name: "React with 🚀" }));

    expect(sendMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "reaction",
        metadata: expect.objectContaining({ emoji: "🚀", targetMessageId: remoteMessage.id }),
      }),
    );

    sendMessageMock.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Base Pay gift" }));
    fireEvent.change(screen.getByLabelText("Token"), { target: { value: "ETH" } });
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Note"), { target: { value: "Fueling our collab" } });

    fireEvent.click(screen.getByRole("button", { name: "Send gift" }));

    await waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "gift",
          body: expect.stringContaining("3 ETH"),
          metadata: expect.objectContaining({ asset: "ETH", amount: 3, type: "gift" }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.queryByText(/Send a Base Pay micro-gift/)).not.toBeInTheDocument();
    });
  });
});
