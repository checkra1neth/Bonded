import { describe, expect, it, vi, type Mock } from "vitest";

import { notifyChatMessage, notifyMutualMatch, showLocalNotification } from "../notifications";
import type { MatchNotification } from "@/lib/matching/queue";
import type { ChatMessage } from "@/lib/chat/types";

function createRegistration() {
  return {
    showNotification: vi.fn(() => Promise.resolve()),
  } as unknown as ServiceWorkerRegistration;
}

describe("mobile notifications", () => {
  it("displays mutual match payloads", async () => {
    const registration = createRegistration();
    const notification: MatchNotification = {
      id: "notification_1",
      type: "mutual-match",
      message: "You and Avery are a match!",
      createdAt: Date.now(),
      read: false,
      data: { matchId: "match_1", candidateId: "candidate_1" },
    };

    await notifyMutualMatch(registration, notification);

    expect(registration.showNotification).toHaveBeenCalledTimes(1);
    const showNotification = registration.showNotification as unknown as Mock;
    const [title, options] = showNotification.mock.calls[0] ?? [];
    expect(title).toBe("New mutual match");
    expect(options?.tag).toBe(notification.id);
    expect(options?.data).toMatchObject({ matchId: "match_1" });
  });

  it("summarizes chat messages", async () => {
    const registration = createRegistration();
    const message: ChatMessage = {
      id: "message-1",
      conversationId: "conversation-1",
      senderId: "user-2",
      senderName: "River",
      body: "Ready for Base mainnet date night?",
      kind: "text",
      status: "delivered",
      createdAt: Date.now(),
    };

    await notifyChatMessage(registration, message, "River");

    expect(registration.showNotification).toHaveBeenCalledTimes(1);
    const showNotification = registration.showNotification as unknown as Mock;
    const [, options] = showNotification.mock.calls[0] ?? [];
    expect(options?.data).toMatchObject({ conversationId: message.conversationId });
    expect(options?.tag).toContain(message.id);
  });

  it("allows custom notification payloads", async () => {
    const registration = createRegistration();
    await showLocalNotification(registration, {
      title: "Custom",
      body: "Payload",
      data: { foo: "bar" },
      tag: "custom-1",
    });

    expect(registration.showNotification).toHaveBeenCalledWith("Custom", expect.objectContaining({
      body: "Payload",
      tag: "custom-1",
    }));
  });
});
