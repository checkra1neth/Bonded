import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  appendMessage,
  clearPendingAutoResponse,
  getPendingAutoResponse,
  listConnections,
  listMessages,
  registerConnection,
  resetChatState,
  setPendingAutoResponse,
  unregisterConnection,
  updateMessageStatus,
} from "../state";
import { createAutoResponse, toDeliveredMessage } from "../autoresponder";
import type { ChatParticipant } from "../types";

const participant: ChatParticipant = {
  userId: "user-1",
  displayName: "Ava",
  avatarColor: "linear-gradient(135deg, #5f5bff, #00d1ff)",
  role: "seeker",
};

const peer: ChatParticipant = {
  userId: "user-2",
  displayName: "Nova",
  avatarColor: "linear-gradient(135deg, #ff8a8a, #ffd76f)",
  role: "candidate",
};

function mockSocket(): WebSocket {
  return {
    send: vi.fn(),
    close: vi.fn(),
  } as unknown as WebSocket;
}

const conversationId = "conversation-1";

beforeEach(() => {
  resetChatState();
});

describe("chat state store", () => {
  it("registers connections and cleans up when sockets close", () => {
    const socket = mockSocket();
    registerConnection(conversationId, socket, participant, peer);

    const connections = listConnections(conversationId);
    expect(connections).toHaveLength(1);
    expect(connections[0]?.participant.userId).toBe(participant.userId);

    unregisterConnection(conversationId, socket);
    expect(listConnections(conversationId)).toHaveLength(0);
  });

  it("tracks messages and updates statuses", () => {
    registerConnection(conversationId, mockSocket(), participant, peer);
    const message = toDeliveredMessage(conversationId, participant, "gm", Date.now());
    appendMessage(conversationId, message);

    const history = listMessages(conversationId);
    expect(history).toHaveLength(1);
    expect(history[0]?.status).toBe("delivered");
    expect(history[0]?.kind).toBe("text");

    const delivered = updateMessageStatus(conversationId, message.id, "delivered", Date.now());
    expect(delivered?.deliveredAt).toBeDefined();

    const read = updateMessageStatus(conversationId, message.id, "read", Date.now() + 100);
    expect(read?.status).toBe("read");
    expect(read?.readAt).toBeDefined();
  });

  it("stores and clears pending auto response handles", () => {
    const timeout = setTimeout(() => undefined, 10);
    setPendingAutoResponse(conversationId, timeout);
    expect(getPendingAutoResponse(conversationId)).toBe(timeout);

    clearPendingAutoResponse(conversationId);
    expect(getPendingAutoResponse(conversationId)).toBeUndefined();
    clearTimeout(timeout);
  });
});

describe("auto response planning", () => {
  it("creates contextual auto responses based on history", () => {
    const timestamp = Date.now();
    const message = toDeliveredMessage(conversationId, participant, "gm degen", timestamp);
    appendMessage(conversationId, message);
    const plan = createAutoResponse(peer, listMessages(conversationId));

    expect(plan.id).toMatch(/[0-9a-f-]{8,}/i);
    expect(plan.body).toContain(peer.displayName);
    expect(plan.typingDuration).toBeGreaterThan(0);
    expect(plan.sendDelay).toBeGreaterThan(plan.typingDuration);
  });
});
