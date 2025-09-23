import type { ChatMessage, ChatParticipant, MessageStatus } from "./types";

type ParticipantConnection = {
  socket: WebSocket;
  participant: ChatParticipant;
};

type ConversationState = {
  messages: ChatMessage[];
  connections: Set<ParticipantConnection>;
  peer?: ChatParticipant;
  lastMessageAt?: number;
  pendingAutoResponse?: ReturnType<typeof setTimeout>;
};

type ChatState = {
  conversations: Map<string, ConversationState>;
};

const globalSymbol = Symbol.for("bonded.chat.state");

type GlobalWithChatState = typeof globalThis & {
  [globalSymbol]?: ChatState;
};

function createChatState(): ChatState {
  return { conversations: new Map() };
}

export function getChatState(): ChatState {
  const globalObject = globalThis as GlobalWithChatState;
  if (!globalObject[globalSymbol]) {
    globalObject[globalSymbol] = createChatState();
  }
  return globalObject[globalSymbol]!;
}

export function resetChatState() {
  const globalObject = globalThis as GlobalWithChatState;
  globalObject[globalSymbol] = createChatState();
}

export function ensureConversation(conversationId: string): ConversationState {
  const state = getChatState();
  let conversation = state.conversations.get(conversationId);
  if (!conversation) {
    conversation = {
      messages: [],
      connections: new Set(),
      lastMessageAt: undefined,
      peer: undefined,
      pendingAutoResponse: undefined,
    };
    state.conversations.set(conversationId, conversation);
  }
  return conversation;
}

export function registerConnection(
  conversationId: string,
  socket: WebSocket,
  participant: ChatParticipant,
  peer?: ChatParticipant,
): ConversationState {
  const conversation = ensureConversation(conversationId);
  conversation.connections.add({ socket, participant });
  if (peer) {
    conversation.peer = peer;
  }
  return conversation;
}

export function unregisterConnection(conversationId: string, socket: WebSocket) {
  const state = getChatState();
  const conversation = state.conversations.get(conversationId);
  if (!conversation) {
    return;
  }
  for (const connection of conversation.connections) {
    if (connection.socket === socket) {
      conversation.connections.delete(connection);
      break;
    }
  }
  if (!conversation.connections.size && !conversation.messages.length) {
    state.conversations.delete(conversationId);
  }
}

export function listConnections(
  conversationId: string,
  options: { excludeSocket?: WebSocket } = {},
): ParticipantConnection[] {
  const conversation = ensureConversation(conversationId);
  const participants: ParticipantConnection[] = [];
  for (const connection of conversation.connections) {
    if (options.excludeSocket && connection.socket === options.excludeSocket) {
      continue;
    }
    participants.push(connection);
  }
  return participants;
}

export function getConversationPeer(conversationId: string): ChatParticipant | undefined {
  return ensureConversation(conversationId).peer;
}

export function setConversationPeer(conversationId: string, peer: ChatParticipant) {
  const conversation = ensureConversation(conversationId);
  conversation.peer = peer;
}

export function appendMessage(conversationId: string, message: ChatMessage) {
  const conversation = ensureConversation(conversationId);
  conversation.messages.push(message);
  conversation.lastMessageAt = message.createdAt;
}

export function listMessages(conversationId: string): ChatMessage[] {
  return [...ensureConversation(conversationId).messages];
}

export function updateMessageStatus(
  conversationId: string,
  messageId: string,
  status: MessageStatus,
  timestamp: number,
): ChatMessage | undefined {
  const conversation = ensureConversation(conversationId);
  const message = conversation.messages.find((entry) => entry.id === messageId);
  if (!message) {
    return undefined;
  }
  if (status === "delivered") {
    message.status = "delivered";
    message.deliveredAt = timestamp;
  } else if (status === "read") {
    message.status = "read";
    message.readAt = timestamp;
  } else {
    message.status = status;
  }
  return message;
}

export function setPendingAutoResponse(
  conversationId: string,
  timeoutId: ReturnType<typeof setTimeout> | undefined,
) {
  const conversation = ensureConversation(conversationId);
  conversation.pendingAutoResponse = timeoutId;
}

export function getPendingAutoResponse(
  conversationId: string,
): ReturnType<typeof setTimeout> | undefined {
  return ensureConversation(conversationId).pendingAutoResponse;
}

export function clearPendingAutoResponse(conversationId: string) {
  const conversation = ensureConversation(conversationId);
  conversation.pendingAutoResponse = undefined;
}
