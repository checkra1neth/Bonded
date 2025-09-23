import type { ChatMessage } from "../chat/types";
import type { PortfolioPrivacyPreferences } from "../portfolio/privacy";
import type { SanitizedPortfolioSnapshot } from "../portfolio/types";

export interface PortabilityConversationSummary {
  conversationId: string;
  messageCount: number;
  lastMessageAt?: number;
  participants?: string[];
}

export interface PortabilityArchive {
  userId: string;
  generatedAt: string;
  preferences: PortfolioPrivacyPreferences;
  portfolio: SanitizedPortfolioSnapshot;
  conversations: PortabilityConversationSummary[];
  checksum: string;
}

export interface PortabilityArchiveInput {
  userId: string;
  preferences: PortfolioPrivacyPreferences;
  portfolio: SanitizedPortfolioSnapshot;
  conversations?: Array<{ conversationId: string; messages: ChatMessage[]; participants?: string[] }>;
  generatedAt?: Date;
}

export interface DataDeletionPlan {
  userId: string;
  requestedAt: string;
  purgeConversations: string[];
  redactPortfolio: boolean;
  revokeKeys: boolean;
  notifyMatches: boolean;
}

export interface DataDeletionRequest {
  userId: string;
  conversations?: string[];
  requestedAt?: Date;
  includePortfolio?: boolean;
}

export function createPortabilityArchive(input: PortabilityArchiveInput): PortabilityArchive {
  const generatedAt = input.generatedAt ?? new Date();
  const conversations = (input.conversations ?? []).map((entry) => ({
    conversationId: entry.conversationId,
    messageCount: entry.messages.length,
    lastMessageAt: entry.messages[entry.messages.length - 1]?.createdAt,
    participants: entry.participants,
  }));

  const payload = {
    userId: input.userId,
    generatedAt: generatedAt.toISOString(),
    preferences: input.preferences,
    portfolio: input.portfolio,
    conversations,
  } satisfies Omit<PortabilityArchive, "checksum">;

  return {
    ...payload,
    checksum: computeChecksum(payload),
  };
}

export function planDataDeletion(request: DataDeletionRequest): DataDeletionPlan {
  const requestedAt = request.requestedAt ?? new Date();
  return {
    userId: request.userId,
    requestedAt: requestedAt.toISOString(),
    purgeConversations: [...new Set(request.conversations ?? [])],
    redactPortfolio: Boolean(request.includePortfolio),
    revokeKeys: true,
    notifyMatches: true,
  };
}

function computeChecksum(payload: Omit<PortabilityArchive, "checksum">): string {
  const normalized = JSON.stringify(payload);
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 33 + normalized.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
