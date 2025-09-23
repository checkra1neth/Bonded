import type { MatchDecision } from "../matching/compatibility";
import type { MatchQueueEntry } from "../matching/queue";

export type PremiumFeature =
  | "unlimited_likes"
  | "advanced_filters"
  | "who_liked_me"
  | "priority_matching"
  | "exclusive_events"
  | "undo_swipe"
  | "super_like_spotlight"
  | "profile_highlighting"
  | "exclusive_content";

export type PremiumPlanId = "free" | "premium_founder" | "premium_partner";

export interface PremiumPlan {
  id: PremiumPlanId;
  name: string;
  description: string;
  monthlyPriceUsd: number;
  features: Record<PremiumFeature, boolean>;
  maxDailyLikes: number | null;
  maxDailySuperLikes: number | null;
  priorityMultiplier: number;
  perks: string[];
}

export type BasePayPaymentStatus = "pending" | "authorized" | "settled" | "failed";

export interface BasePayCheckoutSession {
  id: string;
  appId: string;
  planId: PremiumPlanId;
  walletAddress: string;
  amountUsd: number;
  currency: "USD";
  status: BasePayPaymentStatus;
  createdAt: number;
  expiresAt: number;
  metadata: {
    email?: string;
    referrer?: string;
  };
}

export interface BasePayPaymentProof {
  sessionId: string;
  status: BasePayPaymentStatus;
  signature: string;
  settledAt?: number;
}

export interface PremiumSubscription {
  id: string;
  planId: PremiumPlanId;
  walletAddress: string;
  status: "active" | "canceled" | "incomplete";
  startedAt: number;
  renewsAt: number;
  paymentReference: string;
}

export interface SubscriptionActivationResult {
  session: BasePayCheckoutSession;
  subscription: PremiumSubscription;
}

export interface PremiumUsageWindow {
  windowStart: number;
  likes: number;
  superLikes: number;
}

export interface LikeAllowanceEvaluation {
  canSend: boolean;
  remainingLikes: number | null;
  remainingSuperLikes: number | null;
  reason?: string;
}

export interface PremiumDecisionContext {
  decision: MatchDecision;
  usage: PremiumUsageWindow;
  timestamp: number;
}

export interface InboundLikeInsight {
  candidateId: string;
  displayName: string;
  compatibility: number;
  personality: string;
  headline: string;
  receivedAt: number;
  intent: MatchDecision;
  mutualConfidence: number;
}

export interface PremiumInsights {
  whoLikedMe: InboundLikeInsight[];
}

export interface PremiumMatchQueueContext {
  entries: MatchQueueEntry[];
}
