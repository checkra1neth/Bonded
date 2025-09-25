import type {
  ChatMessage,
  ChatMessageEncryption,
  ChatMessageKind,
  ChatMessageMetadata,
  ChatParticipant,
} from "./types";
import { maskPreview } from "./encryption";

const FALLBACK_RESPONSES = [
  "Love that energy. Want to trade governance alpha sometime soon?",
  "We should sync calendars and compare Base strategies this week.",
  "Haha, absolutely. Got any spicy vaults you're tracking?",
  "Totally feel the same. Maybe we co-host a Farcaster frame drop?",
  "Sounds like a plan. Let's swap dashboards and jam.",
];

const KEYWORD_RESPONSES: Array<{
  test: RegExp;
  replies: string[];
}> = [
  {
    test: /gm|good\s?morning/i,
    replies: [
      "gm gm! Already brewed the matcha and queued some swaps.",
      "gm! Did you catch the overnight Base flows?",
    ],
  },
  {
    test: /degen|ape|moon/i,
    replies: [
      "Haha same — always down for a coordinated degen mission.",
      "Let's spin up a safe degen checklist before we ape though.",
    ],
  },
  {
    test: /chat|talk|call|sync/i,
    replies: [
      "Let's do it. I'll bring the dashboards, you bring the alpha.",
      "Absolutely — maybe right after the next governance vote?",
    ],
  },
  {
    test: /defi|vault|farm/i,
    replies: [
      "Defi brain is buzzing — I've got a Sommelier vault you'd love.",
      "Let's compare vault notes and build a co-farming plan.",
    ],
  },
  {
    test: /nft|art|gallery|mint/i,
    replies: [
      "I have a BasePaint palette ready with your name on it.",
      "NFT gallery walk date night? I'll bring the curated playlist.",
    ],
  },
];

const QUESTION_RESPONSES = [
  "I'd say let's start with a voice note trade — what's your timezone like?",
  "Great question. What's your go-to move when markets chop sideways?",
  "I love that topic. Want to riff on it over a Base Pay coffee?",
];

const RANDOM_TYPING_WINDOW: [number, number] = [1200, 2100];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function clampRange([min, max]: [number, number]) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface AutoResponsePlan {
  id: string;
  body: string;
  typingDuration: number;
  sendDelay: number;
}

export function createAutoResponse(
  peer: ChatParticipant,
  history: ChatMessage[],
): AutoResponsePlan {
  const lastMessage = history[history.length - 1];
  const body = buildResponseText(lastMessage?.body ?? "");
  const typingDuration = clampRange(RANDOM_TYPING_WINDOW);
  const sendDelay = typingDuration + clampRange([500, 1500]);

  return {
    id: crypto.randomUUID(),
    body: `${body} — ${peer.displayName}`,
    typingDuration,
    sendDelay,
  };
}

function buildResponseText(message: string): string {
  if (!message) {
    return pickRandom(FALLBACK_RESPONSES);
  }

  for (const { test, replies } of KEYWORD_RESPONSES) {
    if (test.test(message)) {
      return pickRandom(replies);
    }
  }

  if (message.trim().endsWith("?")) {
    return pickRandom(QUESTION_RESPONSES);
  }

  return pickRandom(FALLBACK_RESPONSES);
}

export function toDeliveredMessage(
  conversationId: string,
  sender: ChatParticipant,
  body: string,
  timestamp: number,
  options: {
    kind?: ChatMessageKind;
    metadata?: ChatMessageMetadata;
    preview?: string;
    encryption?: ChatMessageEncryption;
  } = {},
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    conversationId,
    senderId: sender.userId,
    senderName: sender.displayName,
    senderAvatarColor: sender.avatarColor,
    body,
    kind: options.kind ?? "text",
    metadata: options.metadata,
    status: "delivered",
    createdAt: timestamp,
    deliveredAt: timestamp,
    preview: options.preview ?? maskPreview(body),
    encryption: options.encryption,
  };
}
