export type ChallengeDifficulty = "starter" | "intermediate" | "advanced";

export type ChallengeTaskType =
  | "defi"
  | "nft"
  | "social"
  | "education"
  | "onchain_action";

export type ChallengeTaskTargetKind = "actions" | "streak" | "collaboration";

export interface ChallengeTaskTarget {
  kind: ChallengeTaskTargetKind;
  goal: number;
  cadence?: "daily" | "weekly" | "one_time";
  minimumCollaborators?: number;
}

export interface ChallengeTaskVerification {
  method: "transaction" | "submission" | "host_confirmation" | "snapshot";
  detail: string;
}

export interface ChallengeTaskBonus {
  description: string;
  points: number;
}

export interface ChallengeTaskDefinition {
  id: string;
  title: string;
  summary: string;
  type: ChallengeTaskType;
  focusAreas: string[];
  points: number;
  category: "solo" | "team";
  target: ChallengeTaskTarget;
  verification: ChallengeTaskVerification;
  bonus?: ChallengeTaskBonus;
}

export interface ChallengeRewardDefinition {
  badgeId: string;
  perks: string[];
  spotlight: string;
}

export interface ChallengeDefinition {
  id: string;
  slug: string;
  title: string;
  theme: string;
  summary: string;
  difficulty: ChallengeDifficulty;
  focusAreas: string[];
  trendingNarratives: string[];
  featuredProtocols: string[];
  communitySpotlight: string;
  weekOf: string;
  startsAt: Date;
  endsAt: Date;
  tasks: ChallengeTaskDefinition[];
  rewards: ChallengeRewardDefinition;
}

export type TaskProgressStatus = "not_started" | "in_progress" | "complete";

export interface TaskContributionRecord {
  amount: number;
  note?: string;
  timestamp: number;
  proofUrl?: string;
  collaborators?: string[];
}

export interface TaskProgressRecord {
  taskId: string;
  completed: number;
  target: number;
  status: TaskProgressStatus;
  percentComplete: number;
  contributions: TaskContributionRecord[];
  lastUpdated: number | null;
}

export interface ChallengeParticipantProfile {
  userId: string;
  displayName: string;
  avatarColor?: string;
  focusAreas: string[];
  timezone: string;
  strengths: string[];
  preferredRole?: "host" | "researcher" | "curator" | "strategist";
}

export interface ChallengeParticipantState extends ChallengeParticipantProfile {
  xp: number;
  streak: number;
  completedTaskIds: string[];
  progress: Record<string, TaskProgressRecord>;
  badges: string[];
  lastSubmissionAt?: number;
  tier: ChallengeDifficulty;
}

export type LeaderboardTrend = "new" | "steady" | "up";

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  points: number;
  streak: number;
  completedTasks: number;
  rank: number;
  trend: LeaderboardTrend;
  focusAreas: string[];
}

export type EventType =
  | "defi_study_group"
  | "nft_gallery_walk"
  | "market_briefing"
  | "community_buidl"
  | "retroactive_review";

export type EventFormat = "virtual" | "in_person" | "hybrid";

export interface EventAgendaItem {
  title: string;
  startOffsetMinutes: number;
  durationMinutes: number;
  facilitator: string;
  outcome: string;
}

export type EventAccessLevel = "standard" | "premium";

export interface ChallengeEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  format: EventFormat;
  focusAreas: string[];
  startTime: Date;
  endTime: Date;
  host: string;
  location: string;
  capacity: number;
  vibe: string;
  resources: string[];
  agenda: EventAgendaItem[];
  recommendedRoles: string[];
  access: EventAccessLevel;
  premiumPerks?: string[];
}

export interface EventConnectionSuggestion {
  eventId: string;
  participants: Array<{
    userId: string;
    displayName: string;
    focusAreas: string[];
  }>;
  synergyScore: number;
  reason: string;
  highlight: string;
}

export type BadgeRarity = "core" | "elite" | "legendary";

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  rarity: BadgeRarity;
  icon: string;
  criteria: string;
}

export interface BadgeAward {
  badgeId: string;
  userId: string;
  reason: string;
  awardedAt: number;
}

export interface BadgeProgressProjection {
  badgeId: string;
  percent: number;
  requirement: string;
}
