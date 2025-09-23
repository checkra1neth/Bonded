import { resolveStartOfDay } from "./time";
import type { PremiumFeature, PremiumPlan, PremiumPlanId } from "./types";

const SECONDS_IN_DAY = 86_400;

const plans: Record<PremiumPlanId, PremiumPlan> = {
  free: {
    id: "free",
    name: "Base Access",
    description: "Core matching with daily like limits and standard queue rotation.",
    monthlyPriceUsd: 0,
    features: {
      unlimited_likes: false,
      advanced_filters: false,
      who_liked_me: false,
      priority_matching: false,
      exclusive_events: false,
      undo_swipe: false,
      super_like_spotlight: false,
      profile_highlighting: false,
      exclusive_content: false,
    },
    maxDailyLikes: 25,
    maxDailySuperLikes: 1,
    priorityMultiplier: 1,
    perks: ["Daily compatibility queue", "Standard discovery insights"],
  },
  premium_founder: {
    id: "premium_founder",
    name: "Bonded Founder",
    description: "Unlock every premium signal with Base Pay powered billing.",
    monthlyPriceUsd: 39,
    features: {
      unlimited_likes: true,
      advanced_filters: true,
      who_liked_me: true,
      priority_matching: true,
      exclusive_events: true,
      undo_swipe: true,
      super_like_spotlight: true,
      profile_highlighting: true,
      exclusive_content: true,
    },
    maxDailyLikes: null,
    maxDailySuperLikes: null,
    priorityMultiplier: 1.35,
    perks: [
      "Unlimited likes and super likes",
      "Compatibility filters by thesis and activity",
      "Real-time 'who liked me' radar",
      "Priority queue placement",
      "Super like spotlight with follow-up prompts",
      "Undo last swipe safety net",
      "Premium Base community salons",
    ],
  },
  premium_partner: {
    id: "premium_partner",
    name: "Partner Collective",
    description: "Designed for active collaborators who host events and referrals.",
    monthlyPriceUsd: 79,
    features: {
      unlimited_likes: true,
      advanced_filters: true,
      who_liked_me: true,
      priority_matching: true,
      exclusive_events: true,
      undo_swipe: true,
      super_like_spotlight: true,
      profile_highlighting: true,
      exclusive_content: true,
    },
    maxDailyLikes: null,
    maxDailySuperLikes: null,
    priorityMultiplier: 1.5,
    perks: [
      "Concierge intros to high-signal wallets",
      "Priority placement in viral reports",
      "Premium event co-host slots",
      "Undo and replay top connections",
      "Referral revenue share",
    ],
  },
};

export function resolvePlan(planId: PremiumPlanId): PremiumPlan {
  const plan = plans[planId];
  if (!plan) {
    throw new Error(`Unknown premium plan: ${planId}`);
  }
  return plan;
}

export function hasFeature(plan: PremiumPlan, feature: PremiumFeature): boolean {
  return plan.features[feature] ?? false;
}

export interface LikeWindowInfo {
  windowStart: number;
  windowEnd: number;
}

export function determineUsageWindow(reference: number): LikeWindowInfo {
  const windowStart = resolveStartOfDay(reference);
  return { windowStart, windowEnd: windowStart + SECONDS_IN_DAY * 1000 };
}

export function describePlan(plan: PremiumPlan): string {
  const badge = plan.monthlyPriceUsd === 0 ? "Free" : `$${plan.monthlyPriceUsd}/mo`;
  return `${plan.name} • ${badge}`;
}

export const premiumPlans = plans;
