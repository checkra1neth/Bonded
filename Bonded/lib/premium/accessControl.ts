import { determineUsageWindow, hasFeature } from "./plans";
import { isWithinWindow } from "./time";
import type {
  LikeAllowanceEvaluation,
  PremiumDecisionContext,
  PremiumPlan,
  PremiumUsageWindow,
} from "./types";

const MINIMUM_REMAINING = 0;

function normalizeUsageWindow(usage: PremiumUsageWindow, timestamp: number): PremiumUsageWindow {
  if (isWithinWindow(timestamp, usage.windowStart)) {
    return usage;
  }
  const { windowStart } = determineUsageWindow(timestamp);
  return { windowStart, likes: 0, superLikes: 0 };
}

function remaining(limit: number | null, used: number, delta: number): number | null {
  if (limit === null) {
    return null;
  }
  return Math.max(limit - used - delta, MINIMUM_REMAINING);
}

export function evaluateDecision(
  plan: PremiumPlan,
  context: PremiumDecisionContext,
): LikeAllowanceEvaluation {
  const normalized = normalizeUsageWindow(context.usage, context.timestamp);

  if (context.decision === "pass") {
    return {
      canSend: true,
      remainingLikes: remaining(plan.maxDailyLikes, normalized.likes, 0),
      remainingSuperLikes: remaining(plan.maxDailySuperLikes, normalized.superLikes, 0),
    };
  }

  if (hasFeature(plan, "unlimited_likes")) {
    return {
      canSend: true,
      remainingLikes: null,
      remainingSuperLikes: plan.maxDailySuperLikes === null
        ? null
        : remaining(plan.maxDailySuperLikes, normalized.superLikes, context.decision === "super" ? 1 : 0),
    };
  }

  const likeLimit = plan.maxDailyLikes;
  if (likeLimit !== null && normalized.likes >= likeLimit) {
    return {
      canSend: false,
      remainingLikes: 0,
      remainingSuperLikes: remaining(plan.maxDailySuperLikes, normalized.superLikes, 0),
      reason: "Daily like limit reached. Upgrade for unlimited likes.",
    };
  }

  if (context.decision === "super") {
    const superLimit = plan.maxDailySuperLikes ?? likeLimit;
    if (superLimit !== null && normalized.superLikes >= superLimit) {
      return {
        canSend: false,
        remainingLikes: remaining(likeLimit, normalized.likes, 0),
        remainingSuperLikes: 0,
        reason: "Super like limit reached for today.",
      };
    }
  }

  return {
    canSend: true,
    remainingLikes: remaining(likeLimit, normalized.likes, 1),
    remainingSuperLikes: remaining(
      plan.maxDailySuperLikes ?? likeLimit,
      normalized.superLikes,
      context.decision === "super" ? 1 : 0,
    ),
  };
}

export function recordDecision(
  plan: PremiumPlan,
  usage: PremiumUsageWindow,
  decision: PremiumDecisionContext["decision"],
  timestamp: number,
): PremiumUsageWindow {
  const normalized = normalizeUsageWindow(usage, timestamp);
  if (decision === "pass") {
    return normalized;
  }

  const nextLikes = normalized.likes + 1;
  const nextSuperLikes = decision === "super" ? normalized.superLikes + 1 : normalized.superLikes;

  return {
    windowStart: normalized.windowStart,
    likes: hasFeature(plan, "unlimited_likes") && plan.maxDailyLikes === null ? normalized.likes : nextLikes,
    superLikes: plan.maxDailySuperLikes === null ? normalized.superLikes : nextSuperLikes,
  };
}

export function revertDecision(
  plan: PremiumPlan,
  usage: PremiumUsageWindow,
  decision: PremiumDecisionContext["decision"],
  timestamp: number,
): PremiumUsageWindow {
  const normalized = normalizeUsageWindow(usage, timestamp);
  if (decision === "pass") {
    return normalized;
  }

  const unlimitedLikes = hasFeature(plan, "unlimited_likes") && plan.maxDailyLikes === null;
  const unlimitedSuperLikes = plan.maxDailySuperLikes === null;

  const likes = unlimitedLikes ? normalized.likes : Math.max(0, normalized.likes - 1);
  const superLikes = unlimitedSuperLikes
    ? normalized.superLikes
    : decision === "super"
    ? Math.max(0, normalized.superLikes - 1)
    : normalized.superLikes;

  return {
    windowStart: normalized.windowStart,
    likes,
    superLikes,
  };
}

export function initializeUsage(timestamp: number): PremiumUsageWindow {
  const { windowStart } = determineUsageWindow(timestamp);
  return { windowStart, likes: 0, superLikes: 0 };
}
