import { applyPrivacyPreferences, normalizePrivacyPreferences } from "../portfolio/privacy";
import type { PortfolioPrivacyPreferencesInput } from "../portfolio/privacy";
import type { PortfolioSnapshot } from "../portfolio/types";

import type {
  ChallengeInvitationMetadata,
  GiftMessageMetadata,
  PortfolioSnippetMetadata,
  PhotoMessageMetadata,
  ReactionMetadata,
  VoiceMessageMetadata,
} from "./types";

const ASSET_USD_RATES: Record<string, number> = {
  USDC: 1,
  ETH: 3200,
  DEGEN: 0.03,
  AERO: 1.25,
  CBETH: 3200,
};

const DEFAULT_GIFT_RATE = 1;

const WAVEFORM_SAMPLE_LENGTH = 24;

export interface BasePayGiftPlanInput {
  asset: string;
  amount: number;
  note?: string;
}

export interface PlannedGiftMessage {
  summary: string;
  metadata: GiftMessageMetadata;
}

export function planBasePayGift(input: BasePayGiftPlanInput): PlannedGiftMessage {
  const amount = Number.isFinite(input.amount) ? Math.max(input.amount, 0) : 0;
  const asset = input.asset.toUpperCase();
  const reference = crypto.randomUUID();
  const rate = ASSET_USD_RATES[asset] ?? DEFAULT_GIFT_RATE;
  const fiatEstimate = Math.round(amount * rate * 100) / 100;

  const metadata: GiftMessageMetadata = {
    type: "gift",
    provider: "base_pay",
    asset,
    amount,
    reference,
    status: "processing",
    note: input.note?.trim() ? input.note.trim() : undefined,
    fiatEstimateUsd: fiatEstimate,
  };

  const formattedAmount = amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
  const summaryBase = `Sent you ${formattedAmount} ${asset} via Base Pay`;
  const summary = metadata.note ? `${summaryBase} — "${metadata.note}"` : summaryBase;

  return { summary, metadata };
}

export interface PortfolioSnippetPlanInput {
  snapshot: PortfolioSnapshot;
  preferences: PortfolioPrivacyPreferencesInput;
}

export interface PlannedPortfolioSnippet {
  summary: string;
  metadata: PortfolioSnippetMetadata;
}

export function planPortfolioSnippet({
  snapshot,
  preferences,
}: PortfolioSnippetPlanInput): PlannedPortfolioSnippet {
  const normalized = normalizePrivacyPreferences(preferences);
  const sanitized = applyPrivacyPreferences(snapshot, preferences);

  const preferenceSnapshot: PortfolioSnippetMetadata["preferences"] = {
    shareTokens: normalized.shareTokens,
    shareDefi: normalized.shareDefi,
    shareNfts: normalized.shareNfts,
    shareActivity: normalized.shareActivity,
    shareHighlights: normalized.shareHighlights,
    tokenVisibility: normalized.tokenVisibility,
    defiVisibility: normalized.defiVisibility,
    nftVisibility: normalized.nftVisibility,
    activityVisibility: normalized.activityVisibility,
  };

  const sections: string[] = [];
  if (normalized.shareTokens) {
    sections.push(normalized.tokenVisibility === "SUMMARY" ? "top tokens" : "token breakdown");
  }
  if (normalized.shareDefi) {
    sections.push(
      normalized.defiVisibility === "SUMMARY" ? "DeFi focus" : "detailed DeFi strategies",
    );
  }
  if (normalized.shareNfts) {
    sections.push(
      normalized.nftVisibility === "SUMMARY" ? "NFT highlights" : "NFT collection lineup",
    );
  }
  if (normalized.shareActivity) {
    sections.push(
      normalized.activityVisibility === "TIMEZONE_ONLY"
        ? "timezone window"
        : "activity cadence",
    );
  }
  if (normalized.shareHighlights) {
    sections.push("portfolio highlights");
  }

  const privacyNote = sections.length
    ? `Shared ${sections.join(", ")} without revealing balances.`
    : "Shared a hello with no portfolio sections.";

  const summary = sections.length
    ? `Shared a privacy-safe portfolio snapshot (${sections.join(", ")})`
    : "Shared a privacy-safe hello";

  const metadata: PortfolioSnippetMetadata = {
    type: "portfolio_snippet",
    snapshot: sanitized,
    preferences: preferenceSnapshot,
    privacyNote,
  };

  return { summary, metadata };
}

export interface ChallengeTemplate {
  id: string;
  title: string;
  description: string;
  stakes: string;
  category: string;
}

export interface ChallengePlanInput {
  template: ChallengeTemplate;
  startAt: Date;
  durationDays: number;
}

export interface PlannedChallengeMessage {
  summary: string;
  metadata: ChallengeInvitationMetadata;
}

export function planChallengeInvitation({
  template,
  startAt,
  durationDays,
}: ChallengePlanInput): PlannedChallengeMessage {
  const endAt = new Date(startAt.getTime());
  endAt.setDate(endAt.getDate() + Math.max(durationDays, 1));

  const metadata: ChallengeInvitationMetadata = {
    type: "challenge",
    challengeId: `${template.id}:${crypto.randomUUID()}`,
    title: template.title,
    description: template.description,
    stakes: template.stakes,
    category: template.category,
    timeline: {
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
    },
    status: "pending",
  };

  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startLabel = startAt.toLocaleDateString(undefined, options);
  const endLabel = endAt.toLocaleDateString(undefined, options);
  const summary = `Invited you to the "${template.title}" challenge (${startLabel}–${endLabel})`;

  return { summary, metadata };
}

export interface VoiceNotePlanInput {
  durationSeconds: number;
  vibe: VoiceMessageMetadata["vibe"];
  transcription?: string;
  waveform?: number[];
  audioUrl?: string;
}

export interface PlannedVoiceMessage {
  summary: string;
  metadata: VoiceMessageMetadata;
}

export function planVoiceNote(input: VoiceNotePlanInput): PlannedVoiceMessage {
  const duration = Math.max(1, Math.round(input.durationSeconds));
  const waveform = (input.waveform ?? generateWaveform(duration)).slice(0, WAVEFORM_SAMPLE_LENGTH);
  const playbackUrl = input.audioUrl ?? `https://voice.bonded.xyz/preview/${crypto.randomUUID()}.mp3`;

  const metadata: VoiceMessageMetadata = {
    type: "voice",
    durationSeconds: duration,
    playbackUrl,
    waveform,
    vibe: input.vibe,
    transcription: input.transcription?.trim() ? input.transcription.trim() : undefined,
  };

  const summaryBase = `Sent a ${duration}s voice note (${input.vibe})`;
  const summary = metadata.transcription
    ? `${summaryBase} — "${metadata.transcription.slice(0, 60)}"`
    : summaryBase;

  return { summary, metadata };
}

export interface PhotoSharePlanInput {
  fileName: string;
  size: number;
  previewUrl: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface PlannedPhotoMessage {
  summary: string;
  metadata: PhotoMessageMetadata;
}

export function planPhotoShare(input: PhotoSharePlanInput): PlannedPhotoMessage {
  const caption = input.caption?.trim();
  const metadata: PhotoMessageMetadata = {
    type: "photo",
    previewUrl: input.previewUrl,
    fileName: input.fileName,
    size: input.size,
    caption: caption && caption.length ? caption : undefined,
    width: input.width,
    height: input.height,
  };

  const summaryBase = "Shared a photo";
  const summary = metadata.caption ? `${summaryBase} — "${metadata.caption.slice(0, 60)}"` : summaryBase;

  return { summary, metadata };
}

function generateWaveform(durationSeconds: number): number[] {
  const samples: number[] = [];
  const length = Math.max(WAVEFORM_SAMPLE_LENGTH, Math.ceil(durationSeconds / 2));
  for (let index = 0; index < length; index += 1) {
    const amplitude = Math.sin((index / length) * Math.PI);
    const randomness = Math.random() * 0.35;
    samples.push(Number((Math.min(1, amplitude + randomness)).toFixed(2)));
  }
  return samples;
}

export interface ReactionPlanInput {
  emoji: string;
  targetMessageId: string;
}

export interface PlannedReactionMessage {
  summary: string;
  metadata: ReactionMetadata;
}

export function planReaction({ emoji, targetMessageId }: ReactionPlanInput): PlannedReactionMessage {
  const metadata: ReactionMetadata = {
    type: "reaction",
    emoji,
    targetMessageId,
  };

  const summary = `Reacted with ${emoji}`;
  return { summary, metadata };
}
