import type { MatchCandidate } from "../matching/compatibility";
import { hasFeature } from "./plans";
import type { PremiumPlan } from "./types";

const CATEGORY_BOOST: Record<string, number> = {
  crypto_soulmates: 0.25,
  defi_compatible: 0.15,
  potential_match: 0,
  different_strategies: -0.05,
};

function interactionBoost(candidate: MatchCandidate): number {
  const initial = candidate.interaction?.initialDecision;
  if (initial && initial !== "pass") {
    return initial === "super" ? 0.18 : 0.12;
  }

  const autoResponse = candidate.interaction?.autoResponse;
  if (autoResponse?.onSuperLike && autoResponse.onSuperLike !== "pass") {
    return 0.08;
  }
  if (autoResponse?.onLike && autoResponse.onLike !== "pass") {
    return 0.05;
  }
  return 0;
}

function computePriorityScore(candidate: MatchCandidate, multiplier: number): number {
  const base = candidate.compatibilityScore.overall * multiplier;
  const categoryBoost = CATEGORY_BOOST[candidate.compatibilityScore.category.id] ?? 0;
  return base + categoryBoost + interactionBoost(candidate);
}

export function prioritizeCandidates(candidates: MatchCandidate[], plan: PremiumPlan): MatchCandidate[] {
  if (!hasFeature(plan, "priority_matching")) {
    return candidates;
  }

  const multiplier = plan.priorityMultiplier <= 0 ? 1 : plan.priorityMultiplier;

  return [...candidates].sort((a, b) => computePriorityScore(b, multiplier) - computePriorityScore(a, multiplier));
}
