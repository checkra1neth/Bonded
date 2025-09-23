"use client";

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  ChatMessage,
  ChatMessageKind,
  ChatMessageMetadata,
  ChatParticipant,
  ChatTypingPayload,
  ClientEvent,
  ServerEvent,
} from "@/lib/chat/types";

export type ChatConnectionStatus = "connecting" | "connected" | "disconnected";

export interface ChatMessageView extends ChatMessage {
  tempId?: string;
  isLocal: boolean;
}

export interface TypingUser {
  userId: string;
  displayName: string;
}

export interface UseChatSessionOptions {
  conversationId: string | null;
  participant: ChatParticipant | null;
  peer?: ChatParticipant;
}

export interface UseChatSessionResult {
  messages: ChatMessageView[];
  typingUsers: TypingUser[];
  status: ChatConnectionStatus;
  sendMessage: (input: ChatMessageInput) => void;
  notifyTyping: () => void;
}

export interface ChatMessageInput {
  body: string;
  kind?: ChatMessageKind;
  metadata?: ChatMessageMetadata;
}

const SOCKET_READY_STATE_OPEN = 1;

export function useChatSession({
  conversationId,
  participant,
  peer,
}: UseChatSessionOptions): UseChatSessionResult {
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [status, setStatus] = useState<ChatConnectionStatus>("connecting");

  const socketRef = useRef<WebSocket | null>(null);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const notifyTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingActiveRef = useRef(false);

  const resetTypingState = useCallback(() => {
    typingTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    typingTimeoutsRef.current.clear();
    setTypingUsers([]);
  }, []);

  useEffect(() => {
  if (!conversationId || !participant) {
      setMessages([]);
      resetTypingState();
      setStatus("disconnected");
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      typingActiveRef.current = false;
      return;
    }

    const { protocol, host } = window.location;
    const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
    const url = `${wsProtocol}//${host}/api/chat/socket`;
    const socket = new WebSocket(url);
    socketRef.current = socket;
    setStatus("connecting");

    socket.addEventListener("open", () => {
      setStatus("connected");
      const initEvent: ClientEvent = {
        type: "init",
        conversationId,
        participant,
        peer,
      };
      socket.send(JSON.stringify(initEvent));
    });

    socket.addEventListener("message", (event) => {
      const data = typeof event.data === "string" ? event.data : "";
      handleServerEvent(data, participant, setMessages, setTypingUsers, typingTimeoutsRef);
    });

    socket.addEventListener("close", () => {
      setStatus("disconnected");
      socketRef.current = null;
    });

    socket.addEventListener("error", () => {
      setStatus("disconnected");
    });

    return () => {
      resetTypingState();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      socket.close();
      typingActiveRef.current = false;
    };
  }, [conversationId, participant, peer, resetTypingState]);

  useEffect(() => {
    if (!participant || !conversationId || !socketRef.current) {
      return;
    }

    const unread = messages.filter(
      (message) => message.senderId !== participant.userId && message.status !== "read",
    );
    if (!unread.length) {
      return;
    }

    if (socketRef.current.readyState === SOCKET_READY_STATE_OPEN) {
      const event: ClientEvent = {
        type: "read",
        conversationId,
        messageIds: unread.map((message) => message.id),
        userId: participant.userId,
      };
      socketRef.current.send(JSON.stringify(event));
    }
  }, [conversationId, messages, participant]);

  useEffect(() => {
    return () => {
      if (notifyTypingTimeoutRef.current) {
        clearTimeout(notifyTypingTimeoutRef.current);
      }
    };
  }, []);

  const sendMessage = useCallback(
    (input: ChatMessageInput) => {
      const trimmed = input.body.trim();
      if (!trimmed || !participant || !conversationId || !socketRef.current) {
        return;
      }
      const kind: ChatMessageKind = input.kind ?? "text";
      const socket = socketRef.current;
      const now = Date.now();
      const tempId = crypto.randomUUID();
      const optimisticMessage: ChatMessageView = {
        id: tempId,
        tempId,
        conversationId,
        senderId: participant.userId,
        senderName: participant.displayName,
        senderAvatarColor: participant.avatarColor,
        body: trimmed,
        kind,
        metadata: input.metadata,
        status: "sent",
        createdAt: now,
        isLocal: true,
      };
      setMessages((current) => [...current, optimisticMessage]);

      if (socket.readyState === SOCKET_READY_STATE_OPEN) {
        const event: ClientEvent = {
          type: "message",
          conversationId,
          tempId,
          body: trimmed,
          kind,
          metadata: input.metadata,
          senderId: participant.userId,
          senderName: participant.displayName,
          senderAvatarColor: participant.avatarColor,
        };
        socket.send(JSON.stringify(event));
      }
    },
    [conversationId, participant],
  );

  const notifyTyping = useCallback(() => {
    if (!participant || !conversationId || !socketRef.current) {
      return;
    }

    const socket = socketRef.current;
    const sendTypingEvent = (isTyping: boolean) => {
      if (socket.readyState !== SOCKET_READY_STATE_OPEN) {
        return;
      }
      const event: ClientEvent = {
        type: "typing",
        conversationId,
        userId: participant.userId,
        displayName: participant.displayName,
        isTyping,
      };
      socket.send(JSON.stringify(event));
    };

    if (!typingActiveRef.current) {
      sendTypingEvent(true);
      typingActiveRef.current = true;
    }

    if (notifyTypingTimeoutRef.current) {
      clearTimeout(notifyTypingTimeoutRef.current);
    }

    notifyTypingTimeoutRef.current = setTimeout(() => {
      if (typingActiveRef.current) {
        sendTypingEvent(false);
        typingActiveRef.current = false;
      }
    }, 1200);
  }, [conversationId, participant]);

  const value = useMemo<UseChatSessionResult>(() => {
    return {
      messages,
      typingUsers,
      status,
      sendMessage,
      notifyTyping,
    };
  }, [messages, typingUsers, status, sendMessage, notifyTyping]);

  return value;
}

function handleServerEvent(
  payload: string,
  participant: ChatParticipant | null,
  setMessages: Dispatch<SetStateAction<ChatMessageView[]>>,
  setTypingUsers: Dispatch<SetStateAction<TypingUser[]>>,
  typingTimeoutsRef: React.MutableRefObject<Map<string, ReturnType<typeof setTimeout>>>,
) {
  let event: ServerEvent & { tempId?: string };
  try {
    event = JSON.parse(payload) as ServerEvent & { tempId?: string };
  } catch (error) {
    console.warn("chat client failed to parse server event", error);
    return;
  }

  if ((event as { type: string }).type === "ping") {
    return;
  }

  switch (event.type) {
    case "history":
      setMessages(
        event.messages
          .slice()
          .sort((a, b) => a.createdAt - b.createdAt)
          .map((message) => enrichMessage(message, participant)),
      );
      break;
    case "message":
      setMessages((current) => {
        const normalized = enrichMessage(event.message, participant);
        if (event.tempId) {
          return current.map((existing) =>
            existing.tempId === event.tempId || existing.id === event.tempId ? normalized : existing,
          );
        }
        const exists = current.some((existing) => existing.id === normalized.id);
        if (exists) {
          return current;
        }
        return [...current, normalized].sort((a, b) => a.createdAt - b.createdAt);
      });
      break;
    case "message:status":
      setMessages((current) =>
        current.map((message) => {
          if (message.id !== event.messageId) {
            return message;
          }
          const next: ChatMessageView = { ...message, status: event.status };
          if (event.status === "delivered") {
            next.deliveredAt = event.at;
          }
          if (event.status === "read") {
            next.readAt = event.at;
          }
          return next;
        }),
      );
      break;
    case "typing":
      updateTypingIndicators(event, setTypingUsers, typingTimeoutsRef);
      break;
    default:
      break;
  }
}

function enrichMessage(message: ChatMessage, participant: ChatParticipant | null): ChatMessageView {
  const isLocal = participant ? message.senderId === participant.userId : false;
  return {
    ...message,
    isLocal,
  };
}

function updateTypingIndicators(
  event: ChatTypingPayload,
  setTypingUsers: Dispatch<SetStateAction<TypingUser[]>>,
  typingTimeoutsRef: React.MutableRefObject<Map<string, ReturnType<typeof setTimeout>>>,
) {
  const { userId, displayName, isTyping, conversationId } = event;
  const key = `${conversationId}:${userId}`;
  const existingTimeout = typingTimeoutsRef.current.get(key);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
    typingTimeoutsRef.current.delete(key);
  }

  if (!isTyping) {
    setTypingUsers((current) => current.filter((entry) => entry.userId !== userId));
    return;
  }

  setTypingUsers((current) => {
    const next = current.filter((entry) => entry.userId !== userId);
    next.push({ userId, displayName });
    return next;
  });

  const timeout = setTimeout(() => {
    typingTimeoutsRef.current.delete(key);
    setTypingUsers((current) => current.filter((entry) => entry.userId !== userId));
  }, 1600);

  typingTimeoutsRef.current.set(key, timeout);
}
