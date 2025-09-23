import type { ChatMessage, ReactionMetadata } from "./types";

export interface ReactionGroup {
  emoji: string;
  count: number;
  users: string[];
  messageIds: string[];
}

export type ReactionGroupMap = Map<string, ReactionGroup[]>;

export interface ReactionExtractionResult<T extends ChatMessage> {
  nonReactionMessages: T[];
  reactions: ReactionGroupMap;
}

export function extractReactions<T extends ChatMessage>(messages: T[]): ReactionExtractionResult<T> {
  const reactions: ReactionGroupMap = new Map();
  const nonReactionMessages: T[] = [];

  for (const message of messages) {
    if (message.kind !== "reaction") {
      nonReactionMessages.push(message);
      continue;
    }

    const metadata = message.metadata as ReactionMetadata | undefined;
    if (!metadata || metadata.type !== "reaction" || !metadata.targetMessageId) {
      nonReactionMessages.push(message);
      continue;
    }

    const targetId = metadata.targetMessageId;
    const emoji = metadata.emoji;
    const existing = reactions.get(targetId) ?? [];
    let group = existing.find((entry) => entry.emoji === emoji);

    if (!group) {
      group = { emoji, count: 0, users: [], messageIds: [] };
      existing.push(group);
    }

    group.count += 1;
    group.users.push(message.senderName);
    group.messageIds.push(message.id);
    reactions.set(targetId, existing);
  }

  return { reactions, nonReactionMessages };
}
