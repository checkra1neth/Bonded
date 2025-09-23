import type { MatchDecision } from "../matching/compatibility";
import { hasFeature } from "./plans";
import type { InboundLikeInsight, PremiumMatchQueueContext, PremiumPlan } from "./types";

const DEFAULT_CONFIDENCE = 0.68;

function resolveIntent(entryDecision?: MatchDecision, autoResponse?: MatchDecision): MatchDecision | null {
  if (entryDecision && entryDecision !== "pass") {
    return entryDecision;
  }
  if (autoResponse && autoResponse !== "pass") {
    return autoResponse;
  }
  return null;
}

export function generateWhoLikedMe(
  context: PremiumMatchQueueContext,
  plan: PremiumPlan,
): InboundLikeInsight[] {
  if (!hasFeature(plan, "who_liked_me")) {
    return [];
  }

  const now = Date.now();
  const insights: InboundLikeInsight[] = [];

  context.entries.forEach((entry, index) => {
    if (entry.status !== "pending") {
      return;
    }

    const candidate = entry.candidate;
    const intent = resolveIntent(candidate.interaction?.initialDecision, candidate.interaction?.autoResponse?.onLike);
    if (!intent) {
      return;
    }

    const compatibility = candidate.compatibilityScore.overall;
    const confidence = Math.max(compatibility, DEFAULT_CONFIDENCE);
    const headline = candidate.compatibilityScore.reasoning[0] ?? "Shared onchain rituals spotted";

    insights.push({
      candidateId: candidate.user.id,
      displayName: candidate.user.displayName,
      compatibility,
      personality: candidate.personality.type,
      headline,
      receivedAt: now - index * 90_000,
      intent,
      mutualConfidence: Math.round(confidence * 100) / 100,
    });
  });

  return insights.sort((a, b) => b.compatibility - a.compatibility);
}
