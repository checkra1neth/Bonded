export type MessageStatus = "sent" | "delivered" | "read";

export interface ChatParticipant {
  userId: string;
  displayName: string;
  avatarColor?: string;
  role?: "seeker" | "candidate" | "system";
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatarColor?: string;
  body: string;
  status: MessageStatus;
  createdAt: number;
  deliveredAt?: number;
  readAt?: number;
}

export interface ChatHistoryPayload {
  type: "history";
  conversationId: string;
  messages: ChatMessage[];
}

export interface ChatMessagePayload {
  type: "message";
  conversationId: string;
  message: ChatMessage;
  tempId?: string;
}

export interface ChatStatusPayload {
  type: "message:status";
  conversationId: string;
  messageId: string;
  status: MessageStatus;
  at: number;
  actorId: string;
}

export interface ChatTypingPayload {
  type: "typing";
  conversationId: string;
  userId: string;
  displayName: string;
  isTyping: boolean;
}

export type ServerEvent =
  | ChatHistoryPayload
  | ChatMessagePayload
  | ChatStatusPayload
  | ChatTypingPayload;

export type ClientEvent =
  | {
      type: "init";
      conversationId: string;
      participant: ChatParticipant;
      peer?: ChatParticipant;
    }
  | {
      type: "message";
      conversationId: string;
      tempId: string;
      body: string;
      senderId: string;
      senderName: string;
      senderAvatarColor?: string;
    }
  | {
      type: "read";
      conversationId: string;
      messageIds: string[];
      userId: string;
    }
  | {
      type: "typing";
      conversationId: string;
      userId: string;
      displayName: string;
      isTyping: boolean;
    };
