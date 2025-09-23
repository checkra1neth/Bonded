import type {
  ActivityVisibilityLevel,
  PortfolioPrivacyPreferences,
  PortfolioVisibilityLevel,
} from "../portfolio/privacy";
import type { SanitizedPortfolioSnapshot } from "../portfolio/types";

export type MessageStatus = "sent" | "delivered" | "read";

export type ChatMessageKind =
  | "text"
  | "gift"
  | "portfolio_snippet"
  | "challenge"
  | "voice"
  | "reaction";

export interface GiftMessageMetadata {
  type: "gift";
  provider: "base_pay";
  asset: string;
  amount: number;
  reference: string;
  status: "initiated" | "processing" | "settled";
  note?: string;
  fiatEstimateUsd?: number;
}

export interface PortfolioSnippetMetadata {
  type: "portfolio_snippet";
  snapshot: SanitizedPortfolioSnapshot;
  preferences: Pick<
    PortfolioPrivacyPreferences,
    | "shareTokens"
    | "shareDefi"
    | "shareNfts"
    | "shareActivity"
    | "shareHighlights"
  > & {
    tokenVisibility: PortfolioVisibilityLevel;
    defiVisibility: PortfolioVisibilityLevel;
    nftVisibility: PortfolioVisibilityLevel;
    activityVisibility: ActivityVisibilityLevel;
  };
  privacyNote: string;
}

export interface ChallengeInvitationMetadata {
  type: "challenge";
  challengeId: string;
  title: string;
  description: string;
  stakes: string;
  category: string;
  timeline: {
    startAt: string;
    endAt: string;
  };
  status: "pending" | "accepted" | "declined";
}

export interface VoiceMessageMetadata {
  type: "voice";
  durationSeconds: number;
  playbackUrl: string;
  waveform: number[];
  vibe: "chill" | "excited" | "romantic" | "strategic";
  transcription?: string;
}

export interface ReactionMetadata {
  type: "reaction";
  emoji: string;
  targetMessageId: string;
}

export type ChatMessageMetadata =
  | GiftMessageMetadata
  | PortfolioSnippetMetadata
  | ChallengeInvitationMetadata
  | VoiceMessageMetadata
  | ReactionMetadata;

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
  kind: ChatMessageKind;
  metadata?: ChatMessageMetadata;
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
      kind: ChatMessageKind;
      metadata?: ChatMessageMetadata;
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
