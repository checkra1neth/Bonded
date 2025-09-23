import type { BadgeDefinition, BadgeRarity } from "../gamification/types";

export type SocialAchievementCategory = "challenge" | "community" | "referral";

export interface SocialAchievement {
  id: string;
  badgeId: string;
  title: string;
  description: string;
  narrative: string;
  earnedAt: number;
  rarity: BadgeRarity;
  category: SocialAchievementCategory;
  spotlight?: string;
}

export type SocialShareChannel = "warpcast" | "lens" | "x" | "copy";

export interface AchievementShareOption {
  channel: SocialShareChannel;
  label: string;
  url: string;
  message: string;
  analyticsTag: string;
}

export interface AchievementWithBadge extends SocialAchievement {
  badge?: BadgeDefinition;
}

export interface SuccessStoryMetric {
  label: string;
  value: string;
}

export interface SuccessStory {
  id: string;
  headline: string;
  summary: string;
  quote: string;
  pair: {
    seeker: string;
    partner: string;
  };
  metrics: SuccessStoryMetric[];
}

export interface CommunityLeaderboardEntry {
  userId: string;
  displayName: string;
  avatarColor: string;
  rank: number;
  points: number;
  change: number;
  category: string;
  highlight: string;
}

export interface CommunityLeaderboard {
  id: string;
  title: string;
  description: string;
  entries: CommunityLeaderboardEntry[];
}

export interface ReferralRewardTier {
  id: string;
  label: string;
  requiredInvites: number;
  reward: string;
}

export interface ReferralRewardLedgerEntry {
  id: string;
  label: string;
  reward: string;
  awardedAt: number;
}

export interface ReferralProgramStatus {
  code: string;
  shareUrl: string;
  invitesSent: number;
  conversions: number;
  tier: ReferralRewardTier;
  nextTier?: ReferralRewardTier;
  progressPercent: number;
  ledger: ReferralRewardLedgerEntry[];
  bonusAvailable?: boolean;
  bonusDescription?: string;
}

export interface SocialShareRecord {
  achievementId: string;
  channel: SocialShareChannel;
  message: string;
  timestamp: number;
}
