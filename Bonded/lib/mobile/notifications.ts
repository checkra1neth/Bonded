import type { MatchNotification } from "@/lib/matching/queue";
import type { ChatMessage, ChatMessageKind } from "@/lib/chat/types";

interface WebNotificationAction {
  action: string;
  title: string;
  icon?: string;
}

type ExtendedNotificationOptions = NotificationOptions & {
  vibrate?: number[];
  actions?: WebNotificationAction[];
  renotify?: boolean;
};

type NotificationPayload = {
  title: string;
  body: string;
  tag?: string;
  data?: Record<string, unknown>;
  badge?: string;
  icon?: string;
  vibrate?: number[];
  actions?: WebNotificationAction[];
};

const DEFAULT_BADGE = "/icon.png";
const DEFAULT_ICON = "/icon.png";

export async function showLocalNotification(
  registration: ServiceWorkerRegistration,
  payload: NotificationPayload,
): Promise<void> {
  const options: ExtendedNotificationOptions = {
    body: payload.body,
    tag: payload.tag,
    data: {
      ...(payload.data ?? {}),
      timestamp: Date.now(),
    },
    badge: payload.badge ?? DEFAULT_BADGE,
    icon: payload.icon ?? DEFAULT_ICON,
    vibrate: payload.vibrate ?? [64, 24, 64],
    actions: payload.actions,
    renotify: true,
  };

  await registration.showNotification(payload.title, options);
}

export async function notifyMutualMatch(
  registration: ServiceWorkerRegistration,
  notification: MatchNotification,
): Promise<void> {
  await showLocalNotification(registration, {
    title: "New mutual match",
    body: notification.message,
    tag: notification.id,
    data: {
      matchId: notification.data.matchId,
      candidateId: notification.data.candidateId,
      url: `/matches/${notification.data.matchId}`,
    },
    actions: [
      {
        action: "open-chat",
        title: "Open chat",
      },
    ],
  });
}

export async function notifyChatMessage(
  registration: ServiceWorkerRegistration,
  message: ChatMessage,
  peerName: string,
  { conversationUrl }: { conversationUrl?: string } = {},
): Promise<void> {
  const summary = summarizeMessage(message.kind, message.body, message.metadata);
  await showLocalNotification(registration, {
    title: `${peerName} sent a message`,
    body: summary,
    tag: `${message.conversationId}:${message.id}`,
    data: {
      conversationId: message.conversationId,
      messageId: message.id,
      url: conversationUrl ?? `/#chat?conversation=${encodeURIComponent(message.conversationId)}`,
    },
    actions: [
      {
        action: "reply",
        title: "Reply",
      },
    ],
  });
}

function summarizeMessage(
  kind: ChatMessageKind,
  body: string,
  metadata: ChatMessage["metadata"],
): string {
  switch (kind) {
    case "text":
      return body.slice(0, 120);
    case "voice": {
      const duration = metadata?.type === "voice" ? metadata.durationSeconds : 0;
      return duration ? `Voice note · ${duration}s` : "Voice note";
    }
    case "gift":
      return metadata?.type === "gift" ? `Gift: ${metadata.asset}` : "Gift shared";
    case "portfolio_snippet":
      return "Shared a portfolio insight";
    case "challenge":
      return metadata?.type === "challenge"
        ? `Challenge invite: ${metadata.title}`
        : "Challenge invite";
    case "reaction":
      return metadata?.type === "reaction" ? `Reacted ${metadata.emoji}` : "New reaction";
    case "photo":
      if (metadata?.type === "photo") {
        return metadata.caption?.slice(0, 80) ?? "Shared a photo";
      }
      return "Shared a photo";
    default:
      return body.slice(0, 100);
  }
}
