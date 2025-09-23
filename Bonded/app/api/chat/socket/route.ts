import { NextRequest } from "next/server";

import {
  appendMessage,
  clearPendingAutoResponse,
  getConversationPeer,
  getPendingAutoResponse,
  listConnections,
  listMessages,
  registerConnection,
  setConversationPeer,
  setPendingAutoResponse,
  unregisterConnection,
  updateMessageStatus,
} from "@/lib/chat/state";
import { createAutoResponse, toDeliveredMessage } from "@/lib/chat/autoresponder";
import type { ChatMessage, ChatParticipant, ClientEvent, ServerEvent } from "@/lib/chat/types";

export const runtime = "edge";

const HEARTBEAT_INTERVAL = 30_000;

type ConnectionContext = {
  conversationId: string | null;
  participant: ChatParticipant | null;
};

export async function GET(request: NextRequest) {
  if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return new Response("Expected websocket", { status: 426 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { 0: client, 1: server } = new (globalThis as any).WebSocketPair();
  const context: ConnectionContext = { conversationId: null, participant: null };
  let heartbeatTimer: ReturnType<typeof setInterval> | undefined;

  const startHeartbeat = () => {
    if (heartbeatTimer) {
      return;
    }
    heartbeatTimer = setInterval(() => {
      try {
        server.send(JSON.stringify({ type: "ping" }));
      } catch (error) {
        console.warn("chat heartbeat failed", error);
      }
    }, HEARTBEAT_INTERVAL);
  };

  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = undefined;
    }
  };

  server.accept();
  startHeartbeat();

  server.addEventListener("message", (event: MessageEvent) => {
    const data = typeof event.data === "string" ? event.data : "";
    const payload = safeParseEvent(data);
    if (!payload) {
      return;
    }

    switch (payload.type) {
      case "init":
        handleInit(server, context, payload);
        break;
      case "message":
        handleIncomingMessage(server, context, payload);
        break;
      case "read":
        handleReadReceipt(context, payload);
        break;
      case "typing":
        handleTypingEvent(server, context, payload);
        break;
      default:
        break;
    }
  });

  server.addEventListener("close", () => {
    stopHeartbeat();
    if (context.conversationId) {
      unregisterConnection(context.conversationId, server);
    }
  });

  server.addEventListener("error", (event) => {
    console.error("chat socket error", event);
  });

  return new Response(null, { status: 101, webSocket: client });
}

function safeParseEvent(payload: string): ClientEvent | null {
  try {
    return JSON.parse(payload) as ClientEvent;
  } catch (error) {
    console.warn("chat socket failed to parse payload", error);
    return null;
  }
}

function handleInit(socket: WebSocket, context: ConnectionContext, payload: Extract<ClientEvent, { type: "init" }>) {
  context.conversationId = payload.conversationId;
  context.participant = payload.participant;
  registerConnection(payload.conversationId, socket, payload.participant, payload.peer);
  if (payload.peer) {
    setConversationPeer(payload.conversationId, payload.peer);
  }

  const history = listMessages(payload.conversationId);
  const event: ServerEvent = {
    type: "history",
    conversationId: payload.conversationId,
    messages: history,
  };

  try {
    socket.send(JSON.stringify(event));
  } catch (error) {
    console.warn("chat socket failed to send history", error);
  }
}

function handleIncomingMessage(
  socket: WebSocket,
  context: ConnectionContext,
  payload: Extract<ClientEvent, { type: "message" }>,
) {
  if (!context.conversationId || !context.participant) {
    return;
  }

  const timestamp = Date.now();
  const sender: ChatParticipant = {
    userId: payload.senderId,
    displayName: payload.senderName,
    avatarColor: payload.senderAvatarColor,
  };
  const message = toDeliveredMessage(
    context.conversationId,
    sender,
    payload.body,
    timestamp,
    { kind: payload.kind, metadata: payload.metadata },
  );
  appendMessage(context.conversationId, message);

  broadcastMessage(context.conversationId, message, payload.tempId, sender.userId);

  const peer = getConversationPeer(context.conversationId);
  if (peer && peer.userId !== sender.userId && payload.kind !== "reaction") {
    scheduleAutoResponse(context.conversationId, peer);
  }
}

function handleReadReceipt(
  context: ConnectionContext,
  payload: Extract<ClientEvent, { type: "read" }>,
) {
  if (!context.conversationId || context.conversationId !== payload.conversationId) {
    return;
  }

  const timestamp = Date.now();
  for (const messageId of payload.messageIds) {
    const updated = updateMessageStatus(payload.conversationId, messageId, "read", timestamp);
    if (updated) {
      broadcast(payload.conversationId, {
        type: "message:status",
        conversationId: payload.conversationId,
        messageId: updated.id,
        status: "read",
        at: timestamp,
        actorId: payload.userId,
      });
    }
  }
}

function handleTypingEvent(
  socket: WebSocket,
  context: ConnectionContext,
  payload: Extract<ClientEvent, { type: "typing" }>,
) {
  if (!context.conversationId || context.conversationId !== payload.conversationId) {
    return;
  }

  broadcast(payload.conversationId, payload, { exclude: socket });
}

function broadcast(conversationId: string, payload: ServerEvent, options: { exclude?: WebSocket } = {}) {
  const message = JSON.stringify(payload);
  for (const connection of listConnections(conversationId, { excludeSocket: options.exclude })) {
    try {
      connection.socket.send(message);
    } catch (error) {
      console.warn("chat socket broadcast failed", error);
    }
  }
}

function broadcastMessage(
  conversationId: string,
  message: ChatMessage,
  tempId: string | undefined,
  senderId: string,
) {
  for (const connection of listConnections(conversationId)) {
    const payload: ServerEvent & { tempId?: string } = {
      type: "message",
      conversationId,
      message,
    };
    if (connection.participant.userId === senderId && tempId) {
      payload.tempId = tempId;
    }
    try {
      connection.socket.send(JSON.stringify(payload));
    } catch (error) {
      console.warn("chat socket failed to deliver message", error);
    }
  }
}

function scheduleAutoResponse(conversationId: string, peer: ChatParticipant) {
  const existing = getPendingAutoResponse(conversationId);
  if (existing) {
    clearTimeout(existing);
  }

  const history = listMessages(conversationId);
  const plan = createAutoResponse(peer, history);

  const typingEvent: ServerEvent = {
    type: "typing",
    conversationId,
    userId: peer.userId,
    displayName: peer.displayName,
    isTyping: true,
  };

  broadcast(conversationId, typingEvent);

  const typingStop = setTimeout(() => {
    broadcast(conversationId, { ...typingEvent, isTyping: false });
  }, plan.typingDuration);

  const timeout = setTimeout(() => {
    clearTimeout(typingStop);
    broadcast(conversationId, { ...typingEvent, isTyping: false });

    const timestamp = Date.now();
    const message = toDeliveredMessage(conversationId, peer, plan.body, timestamp, { kind: "text" });
    appendMessage(conversationId, message);
    broadcastMessage(conversationId, message, undefined, peer.userId);

    const pendingReads = listMessages(conversationId).filter(
      (entry) => entry.senderId !== peer.userId && entry.status !== "read",
    );

    if (pendingReads.length) {
      const readAt = Date.now() + 400;
      setTimeout(() => {
        for (const item of pendingReads) {
          const updated = updateMessageStatus(conversationId, item.id, "read", readAt);
          if (updated) {
            broadcast(conversationId, {
              type: "message:status",
              conversationId,
              messageId: updated.id,
              status: "read",
              at: readAt,
              actorId: peer.userId,
            });
          }
        }
      }, 400);
    }

    clearPendingAutoResponse(conversationId);
  }, plan.sendDelay);

  setPendingAutoResponse(conversationId, timeout);
}
